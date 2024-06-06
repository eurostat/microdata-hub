/** dataFetcher.js 
 *  this file is responsible for fetching data from the server and preparing it
for use in the application. It contains functions that make requests to the server to retrieve data,
as well as functions that process and transform the data for use in the application.
The functions in this file are used by other parts of the application to fetch and process data as needed.
 */ 
import {
	acquireCategoriesCollection,
	acquireDataFlowResources,
	constructArtefactCollectionElement,
	createDataflowStructureKeysTable,
	acquireConstraintsForDfId,
} from "./dataParser.js";
import { sessionKeys, cacheName } from "./sessionStorageKeys.js";
import { getStorageData, setStorageData } from "./utils.js";

/**
 * Retrieves JSON data from the cache or fetches it from the network and stores it in the cache.
 * @param {string} url - The URL of the JSON data to retrieve.
 * @param {boolean} [purge=false] - Whether to force a fetch from the network and update the cache.
 * @returns {Promise<Object>} A promise that resolves to the JSON data object.
 * @throws {Error} If the fetched data does not contain a "data" property.
 */
export async function getJSONDataCache(url, purge = false) {
	const cache = await caches.open(cacheName);
	let response = await cache.match(url);
	if (!response || purge) {
		response = await fetch(url);
		await cache.put(url, response.clone());
	}
	const data = await response.json();
	if (!data.hasOwnProperty("data")) {
		throw new Error('Request is missing the "data object": ', url.href);
	}
	return data;
}

/**
 * Constructs a URL for making an SDMX request based on the provided parameters.
 * @param {Object} p - The parameters for the SDMX request.
 * @param {string} p.type - The type of the SDMX request.
 * @param {string} [p.agency="all"] - The agency for the SDMX request.
 * @param {string} p.id - The ID for the SDMX request.
 * @param {string[]} [p.references] - The references for the SDMX request.
 * @param {string} [p.detail] - The detail for the SDMX request.
 * @returns {URL} A URL object for the SDMX request.
 */
export function sdmxRequestQueryBuilder(p) {
	const base =
		"https://webgate.acceptance.ec.europa.eu/fusionregistry/sdmx/v2/structure";
	const searchParams = {
		format: "sdmx-json",
		...(p.references && { references: p.references }),
		...(p.detail && { detail: p.detail }),
	};
	const queryParams = new URLSearchParams(searchParams).toString();
	const url = `${base}/${p.type}/${p.agency || "all"}/${p.id}/latest?${queryParams}`;
	const urlObj = new URL(url);
	return urlObj;
}

/**
 * Acquires the artifacts collection for a given dataflow ID.
 * @param {string} dfId - The ID of the dataflow.
 * @returns {Promise} A promise that resolves to the artifacts collection.
 */
export async function acquireArtefactsCollection(dfId) {
	const url = sdmxRequestQueryBuilder({
		type: "dataflow",
		id: dfId,
		references: "all",
	});
	const dataflowReferenceCollection = await acquireDataFlowResources(url, dfId);
	const conceptCollection = await constructArtefactCollectionElement(
		dataflowReferenceCollection
	);
	return conceptCollection;
}

/**
 * Makes an asynchronous request to acquire constraints data for a given dataflow ID.
 * @param {string} dfId - The ID of the dataflow for which constraints data is requested.
 * @returns {Promise} A promise that resolves with the constraints data for the specified dataflow ID.
 */
export async function requestConstraintsData(dfId) {
	const url = sdmxRequestQueryBuilder({
		type: "dataflow",
		id: dfId,
		references: "ancestors",
	});
	return await acquireConstraintsForDfId(url, dfId);
}

/**
 * Requests category scheme data from a specific URL using the SDMX request query builder.
 * The category scheme data is retrieved for the ESTAT agency with the ID MICRODATA_DOMAINS
 * and includes all references.
 * @returns {Promise} A promise that resolves with the dataflow structure keys table.
 */
export async function requestCategorySchemeData() {
	const url = sdmxRequestQueryBuilder({
		type: "categoryscheme",
		agency: "ESTAT",
		id: "MICRODATA_DOMAINS",
		references: "all",
	});
	return await createDataflowStructureKeysTable(url);
}

/**
 * Retrieves dataflow IDs that match the form values provided in the formValuesMap.
 * @param {Object} formValuesMap - A map of form values to match against dataflow IDs.
 * @returns {Array} An array of dataflow IDs that match the form values.
 */
export async function getDataflowIdsMatchingFormValues(formValuesMap) {
	if (Object.keys(formValuesMap).length === 0)
		return getStorageData(sessionKeys.dfIdsAll);

	const url = sdmxRequestQueryBuilder({
		type: "categorisation",
		id: "all",
		references: "ancestors",
	});

	const {
		data: { categorisations },
	} = await getJSONDataCache(url);

	const categoriesCollection = JSON.parse(
		sessionStorage.getItem(sessionKeys.dataCategory)
	);

	const formMatchingCategoryUrn = new Set(
		Object.values(formValuesMap).map((value) =>
			getLinkById(categoriesCollection, value)
		)
	);

	const matchingTargets = categorisations.reduce((acc, { source, target }) => {
		if (formMatchingCategoryUrn.has(source)) {
			acc[target] = (acc[target] || 0) + 1;
		}
		return acc;
	}, {});

	const entries = Object.entries(matchingTargets);
	const maxCount = Math.max(...entries.map(([_, value]) => value));

	const result = entries
		.filter(([_, value]) => value === maxCount)
		.map(([key, _]) => getDfIdByDfUrn(key))
		.filter((dfId) => dfId !== null);

	return result;
}

function getLinkById(data, id) {
	const item = data.find((item) => item.id === id);
	return item ? item.link : null;
}

function getDfIdByDfUrn(dfUrn) {
	const data = JSON.parse(sessionStorage.getItem(sessionKeys.dsLinkingDf));
	for (const item of data) {
		if (item.dfUrn === dfUrn) {
			return item.dfId;
		}
	}
	return null;
}

/**
 * Asynchronously fetches category scheme data from a specified URL using SDMX request builder.
 * @returns {Promise} A promise that resolves with the categories collection data.
 */
export async function getCategorySchemeData() {
	const url = sdmxRequestQueryBuilder({
		type: "categoryscheme",
		id: "all",
		references: "parents",
	});
	const categoriesCollection = await acquireCategoriesCollection(url);
	return categoriesCollection;
}

/**
 * Retrieves a limited artefacts collection based on the provided data flow IDs.
 * @param {Array} dfIdsFilteredList - An array of data flow IDs to filter the artefacts collection.
 * @returns {Promise} A filtered artefacts collection based on the provided data flow IDs.
 */
export async function fetchAndFilterArtefactsCollection(dfIdsFilteredList) {
	let artefactsCollection = getStorageData(sessionKeys.artefactsCollection);

	if (!artefactsCollection) {
		artefactsCollection = await Promise.all(
			dfIdsFilteredList.map((id) => acquireArtefactsCollection(id))
		);
		setStorageData(sessionKeys.artefactsCollection, artefactsCollection);
	}

	return filterArtefactsByDfIds(artefactsCollection, dfIdsFilteredList);

	function filterArtefactsByDfIds(artefacts, dfIds) {
		const dfIdsSet = new Set(dfIds);
		return artefacts.filter((artefact) => dfIdsSet.has(artefact.dfId));
	}
}

/**
 * Sets constraints collection based on the given dfIds.
 * @param {Array} dfIds - An array of dfIds to set constraints for.
 * @param {boolean} [purge=false] - A flag to determine whether to purge existing collection.
 * @returns {Promise} The updated constraints collection.
 */
export async function setConstraintsCollection(dfIds, purge = false) {
	let collection = getStorageData(sessionKeys.constraintCollection);

	if (collection && !purge) {
		collection = collection.filter((el) => dfIds.includes(el.dfId));
	} else {
		collection = await Promise.all(
			dfIds.map((dfId) => requestConstraintsData(dfId))
		);
		sessionStorage.setItem(
			sessionKeys.constraintCollection,
			JSON.stringify(collection)
		);
	}
	return collection;
}
