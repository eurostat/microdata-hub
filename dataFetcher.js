import { acquireCategoriesCollection, acquireDataFlowResources, renderConceptsCollection, createDataflowStructureKeysTable, acquireConstraintsForDfId } from "./dataParser.js";
import { sessionKeys, cacheName } from "./sessionStorageKeys.js";
import { getStorageData, setStorageData } from "./utils.js";

// dataFetcher.js
export async function getJSONDataCache(url, purge = false) {
  const cache = await caches.open(cacheName);
  let response = await cache.match(url);
  if (!response || purge) {
    response = await fetch(url);
    await cache.put(url, response.clone());
  }
  const data = await response.json();
  if (!data.hasOwnProperty('data')) {
    throw new Error('Request is missing the "data object": ', url.href);
  }
  return data;
}

export async function acquireArtefactsCollectionFromDfAndDs(dfId) {
  const url = sdmxRequestQueryBuilder({
		type: "dataflow",
		id: dfId,
		references: "all",
	});
  const dataflowReferenceCollection = await acquireDataFlowResources(url, dfId);
  const conceptCollection = await renderConceptsCollection(dataflowReferenceCollection);
  return conceptCollection;
}

export async function requestConstraintsData(dfId) {
  const url = sdmxRequestQueryBuilder({
		type: "dataflow",
		id: dfId,
		references: "ancestors",
	});
	return await acquireConstraintsForDfId(url,dfId);
}

export async function requestCategorySchemeData() {
	const url = sdmxRequestQueryBuilder({
		type: "categoryscheme",
		agency: "ESTAT",
		id: "MICRODATA_DOMAINS",
		references: "all",
	});
	return await createDataflowStructureKeysTable(url);
}
export async function getDataFlows(url) {
  const jsonData = await getJSONDataCache(url);
  const data = jsonData.data;
  return data;
}
export function sdmxRequestQueryBuilder(p) {
	const base = "http://fusion-metadata-registry.estat.s4dad.aws.cloud.tech.ec.europa.eu/sdmx/v2/structure";
	const searchParams = {
		format: "sdmx-json",
		...(p.references && { references: p.references }),
		...(p.detail && { detail: p.detail }),
	};
	const queryParams = new URLSearchParams(searchParams).toString();
	const url = `${base}/${p.type}/${p.agency || "all"}/${p.id}/latest?${queryParams}`;
	// TODO: remove repeated calls
  // if (p.type ==='dataflow' && p.id ==='LFS_ANON_SEC_A') console.trace(url);
	const urlObj = new URL(url);
	// console.log(p.type,p.id, urlObj.searchParams.toString());
	return urlObj
}

export async function getDataflowIdsMatchingFormValues(formValuesMap) {
	if (Object.keys(formValuesMap).length === 0) return getStorageData(sessionKeys.dfIdsAll);

	const url = sdmxRequestQueryBuilder({ type: "categorisation", id: "all", references: "ancestors" });
	const { data: { categorisations } } = await getJSONDataCache(url);
	const categoriesCollection = JSON.parse(sessionStorage.getItem(sessionKeys.dataCategory));

	const formMatchingCategoryUrn = new Set(Object.values(formValuesMap).map(value => getLinkById(categoriesCollection, value)));

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
		.filter(dfId => dfId !== null);

	return result;
}

function getLinkById(data, id) {
	const item = data.find(item => item.id === id);
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
 * Retrieves a limited artefacts collection based on the provided data flow IDs.
 * @param {Array} dfIdsFilteredList - An array of data flow IDs to filter the artefacts collection.
 * @returns {Promise} A filtered artefacts collection based on the provided data flow IDs.
 */
export async function fetchAndFilterArtefactsCollection(dfIdsFilteredList) {
	let artefactsCollection = getStorageData(sessionKeys.dataFlowCollection);

	if (!artefactsCollection) {
		artefactsCollection = await Promise.all(
			dfIdsFilteredList.map((id) => acquireArtefactsCollectionFromDfAndDs(id))
		);
		setStorageData(sessionKeys.dataFlowCollection, artefactsCollection);
	}

	return filterArtefactsByDfIds(artefactsCollection, dfIdsFilteredList);

	function filterArtefactsByDfIds(artefacts, dfIds) {
		const dfIdsSet = new Set(dfIds);
		return artefacts.filter(artefact => dfIdsSet.has(artefact.dfId));
	}
}

export async function setConstraintsCollection(dfIds, purge = false) {
	let collection = getStorageData(sessionKeys.constraintCollection);

	if (collection && !purge) {
		collection = collection.filter((el) =>
			dfIds.includes(el.dfId)
		);
	} else {
		collection = await Promise.all(
			dfIds.map((dfId) => requestConstraintsData(dfId))
		);
		sessionStorage.setItem(sessionKeys.constraintCollection, JSON.stringify(collection));
	}
	return collection;
}

export async function getCategorySchemeData() {
	const url = sdmxRequestQueryBuilder({
		type: "categoryscheme",
		id: "all",
		references: "parents",
	});
	const categoriesCollection = await acquireCategoriesCollection(url);
	return categoriesCollection;
}