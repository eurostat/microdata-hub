// "dataParser.js" 
import { getJSONDataCache } from "./dataFetcher.js";
import { parseStringUrn, getStorageData } from "./utils.js";
import { sessionKeys } from "./sessionStorageKeys.js";

/**
 * Extracts concepts from a data structure object and returns them in a formatted way.
 * @param {Object[]} dataStructureObject - The data structure object containing concepts.
 * @returns {Object} An object with concepts extracted from the data structure object.
 */
function getConcepts(dataStructureObject) {
	return dataStructureObject.reduce((acc, { id, conceptRoles, localRepresentation: { enumeration, textFormat } }) => {
		acc[id] = enumeration ? parseStringUrn(enumeration) : textFormat || { err: "no format" };
		if (conceptRoles) {
			acc[id].conceptRoles = conceptRoles.map(role => parseStringUrn(role).value);
		}
		return acc;
	}, {});
}

/**
 * Returns an object containing the names of concepts from the given concept schemes,
 * excluding the concept scheme with the id "CS_ESTAT_GENERAL_CONCEPTS".
 * @param {Array} conceptSchemes - An array of concept schemes.
 * @returns {Object} An object with concept IDs as keys and their corresponding names as values.
 */
function getName(conceptSchemes) {
	return conceptSchemes
		.filter(cs => cs.id !== "CS_ESTAT_GENERAL_CONCEPTS")
		.reduce((acc, {concepts}) => {
			concepts.forEach(({ id, name }) => {
			acc[id] = { name };
		});
			return acc;
		}, {});
}

/**
 * Returns a mapping of concept IDs to their descriptions by filtering out a specific concept scheme
 * and reducing the array of concepts to an object.
 * @param {Array} conceptSchemes - An array of concept schemes containing concepts with IDs and descriptions.
 * @returns {Object} A mapping of concept IDs to their descriptions.
 */
function getDescription(conceptSchemes) {
	return conceptSchemes
		.filter(cs => cs.id !== "CS_ESTAT_GENERAL_CONCEPTS")
		.reduce((acc, {concepts}) => {
			concepts.forEach(({ id, description }) => {
			acc[id] = { description };
		});
			return acc;
		}, {});
}

/**
 * Transforms a collection of codelists into a map where each key is the codelist ID
 * and each value is an object containing a codes property. The codes property is
 * an object where each key is a code ID and each value is a code name
 * @param {Array} dfCodeListCollection - The collection of code lists to transform
 * @returns {Object} A map where list IDs are keys and values are objects with code ID to code name mappings
 */
function createFormattedCodeLists(dfCodeListCollection) {
	const result = {};
	for (const { id: codeListId, codes } of dfCodeListCollection) {
		const codeMap = {};
		for (const { id: codeId, name } of codes) {
			codeMap[codeId] = name;
		}
		result[codeListId] = { codes: codeMap };
	}
	return result;
}

/**
 * Extracts constraints from the content constraints object.
 * @param {Array} contentConstraints - An array containing content constraints.
 * @returns {Object} - An object containing the extracted constraints.
 */
function getConstraints(contentConstraints) {
	const cubeRegions = contentConstraints[0].cubeRegions; 

	const constraints = cubeRegions.reduce((acc, cubeRegion) => {
		const { attributes } = cubeRegion;

		const cubeConstraints = attributes.reduce((cubeAcc, { id, values }) => {
			cubeAcc[id] = values;
			return cubeAcc;
		}, {});

		return { ...acc, ...cubeConstraints };
	}, {});

	return constraints;
}

/**
 * Retrieves linked categories for a given dataflow based on the data flow categorisations.
 * @param {Array} dfCategorisations - An array of categorisations for the dataflow.
 * @returns {Array} An array of objects containing categorisation information.
 */
function getLinkedCategoriesForDataflow(dfCategorisations) {
	const categoriesCollection = getStorageData(sessionKeys.dataCategory);
	const categoriesMap = categoriesCollection.reduce((acc, item) => {
		acc[item.link] = item;
		return acc;
	}, {});

	return dfCategorisations.map(({ source }) => {
		const category = categoriesMap[source];
		const categorisationKey = category ? category.categorySchemeId : "unknown";
		return {
			[categorisationKey]: {
				id: category ? category.id : "unknown",
				name: category ? category.name : "unknown"
			}
		};
	});
}

/**
 * Transforms a collection of dataflow references into a structured object containing
 * all necessary data for a concept list.
 *
 * @param {Object} dfReferenceCollection - A collection of dataflow references.
 * @property {Array} dataStructures - The data structures of the dataflow.
 * @property {Array} codelists - The code lists of the dataflow.
 * @property {Array} conceptSchemes - The concept schemes of the dataflow.
 * @property {Array} categorisations - The categorisations of the dataflow.
 * @property {Array} contentConstraints - The content constraints of the dataflow.
 * @property {string} dfId - The dataflow ID.
 * @property {Array} provisionAgreements - The provision agreements of the dataflow.
 *
 * @returns {Object} An object containing all necessary data for a concept list.
 * @property {string} dsId - The structure ID.
 * @property {string} dfId - The dataflow ID.
 * @property {Array} categories - The data collection properties: domain, period (year), file type.
 * @property {Array} concepts - A collection of concept IDs with a reference to the code list ID and version.
 * @property {Array} codes - A collection of code list IDs with actual codes.
 * @property {Array} constraints - A collection of dataflow constraints, each constraint is a collection of concept IDs with codes.
 * @property {Array} provisionAgreement - A list of country codes that the agreement is binding.
 * @property {string} description - The concept description text.
 * @property {string} name - The concept name.
 */
export async function constructArtefactCollectionElement(dfReferenceCollection) {
	const {
		dataStructures,
		codelists,
		conceptSchemes,
		categorisations,
		contentConstraints,
		dfId,
		provisionAgreements,
	} = dfReferenceCollection;
	const {
		id: dsId,
		dataStructureComponents: {
			attributeList: { attributes },
			dimensionList: { dimensions },
		},
	} = dataStructures[0];
	const name = getName(conceptSchemes);
	const description = getDescription(conceptSchemes);
	const provisionAgreementCountries = provisionAgreements
		? provisionAgreements.map(({ id }) => id.split("_").pop().substring(0, 2))
		: [];
	const concepts = getConcepts(attributes.concat(dimensions));
	const codes = createFormattedCodeLists(codelists);
	const constraints = getConstraints(contentConstraints);
	const linkedCategoriesForDataflow =
		getLinkedCategoriesForDataflow(categorisations);
	return {
		dsId: dsId,
		dfId: dfId,
		categories: linkedCategoriesForDataflow,
		concepts,
		codes,
		// constraints,
		provisionAgreementCountries,
		description,
		name,
	};
}

/**
 * Asynchronously acquires single data flow resources from the given URL and data flow ID.
 * @param {string} url - The URL to fetch the data from.
 * @param {string} dfId - The ID of the data flow.
 * @returns An object containing various data flow resources such as codelists, categorisations,
 * concept schemes, data structures, content constraints, and provision agreements.
 */
export async function acquireDataFlowResources(url, dfId) {
	// console.log(url.href);
	// console.log(await getJSONDataCache(url));	
	const {
		data: {
			codelists,
			categorisations,
			conceptSchemes,
			dataStructures,
			contentConstraints,
			provisionAgreements
		},
	} = await getJSONDataCache(url);
	return {
		dsId: dataStructures[0].id,
		dfId: dfId,
		codelists,
		categorisations,
		conceptSchemes,
		dataStructures,
		contentConstraints,
		provisionAgreements,
	};
}

/**
 * Creates a dataflow structure keys table based on the provided URL.
 * If the structure links are already stored in sessionStorage, it retrieves and returns them.
 * Otherwise, it fetches the data structures and dataflows from the URL, creates a structure collection
 * and a dataflow collection, links the data structures to their corresponding dataflows, stores the
 * structure links in sessionStorage, and returns the structure collection.
 * @param {string} url - The URL from which to acquire the data flow structure link.
 * @returns {Promise<Array>} A promise that resolves to an array of data structure objects with linked dataflows.
 */
export async function createDataflowStructureKeysTable(url) {

	if (sessionStorage.getItem(sessionKeys.dsLinkingDf)) {
		return JSON.parse(sessionStorage.getItem(sessionKeys.dsLinkingDf));
	}

	const {
		data: { dataStructures, dataflows },
	} = await getJSONDataCache(url);

	const dsInfo = extractDataStructuresInfo(dataStructures);
	const dfInfo = extractDataflowsInfo(dataflows);

	dsInfo.forEach(ds => {
		ds.dfId = Object.keys(dfInfo).find(key => dfInfo[key].dsd === ds.dsUrn);
		ds.dfUrn = dfInfo[ds.dfId].self;
	});

	sessionStorage.setItem(sessionKeys.dsLinkingDf, JSON.stringify(dsInfo));
	return dsInfo;

	function extractDataStructuresInfo(dataStructures) {
		return dataStructures.reduce(
			(acc, { id,  links, version }) => {
				acc.push({
					dsId: id,
					dsUrn: links[0].urn,
					dsVersion: version,
				});
				return acc;
			},
			[]
		);
	}

	function extractDataflowsInfo(dataflows) {
		return dataflows.reduce((acc, { id, structure, links, name, version }) => {
			acc[id] = {
				dsd: structure,
				self: links[0].urn,
				name: name,
				version: version,
			};
			return acc;
		}, {});
	}
}

/**
 * Acquires constraints for a given dataflow ID from a specified URL.
 * @param {string} url - The URL to fetch the data from.
 * @param {string} dfId - The dataflow ID to acquire constraints for.
 * @returns {Promise<{dfId: string, cubeRegions: Array, countries: Set<string>}>} - A promise that resolves to an object containing the acquired constraints.
 */
export async function acquireConstraintsForDfId(url, dfId) {
	const constraints = { dfId: dfId, cubeRegions: [], countries: {}};
	const { data: { contentConstraints }} = await getJSONDataCache(url);

	for (let i = 0; i < contentConstraints.length; i++) {
		const { constraintAttachment, cubeRegions } = contentConstraints[i];  // TODO: ask for clarification why there is a list of both
		const [attachedTo] = Object.keys(constraintAttachment);

		if (Object.keys(constraintAttachment).length > 1) {
			console.warn('Warning: constraintAttachment has more than one key', Object.keys(constraintAttachment));
		}

		const countryCode = getCountryCode(constraintAttachment, attachedTo);

		cubeRegions.forEach(({ attributes, keyValues, components, isIncluded }) => {
			[attributes, keyValues, components].forEach((property) => {
				if (property) {
					const region = getConstraintValues( property, attachedTo, isIncluded, countryCode);
					const conceptIds = Object.keys(region[attachedTo]);
					constraints.cubeRegions.push(region);

					conceptIds.forEach((conceptId) => {
						constraints.countries[conceptId] = constraints.countries[conceptId] || [];
						constraints.countries[conceptId].push(countryCode);
					});
				}
			});
		});
	}

	return constraints;
}

function getCountryCode(constraintAttachment, attachedTo) {
	const [paUrn] = constraintAttachment[attachedTo];
	const countryCode = attachedTo === "dataflows"
		? "ALL"
		: paUrn.split("_").pop().substring(0, 2);
	return countryCode;
}

/**
 * Generates constraint values based on the provided constraint items, attached entity, inclusion status, and country code.
 * @param {Array} constraintItems - An array of constraint items containing id and values.
 * @param {string} attachedTo - The entity to which the constraints are attached.
 * @param {boolean} isIncluded - The inclusion status of the constraints.
 * @param {string} [countryCode="ALL"] - The country code for which the constraints apply.
 * @returns {Object} - The generated constraints object based on the inputs.
 */
function getConstraintValues(constraintItems, attachedTo, isIncluded, countryCode = "ALL") {
	const constraints = { isIncluded: isIncluded };
	constraintItems.forEach(({ id: conceptId, values }) => {
			constraints[attachedTo] = constraints[attachedTo] || {};
			constraints[attachedTo][conceptId] = constraints[attachedTo][conceptId] || {};
			constraints[attachedTo][conceptId][countryCode] = values;
	});
	return constraints;
}

/**
 * Acquires a collection of categories from the provided URL.
 * @param {string} url - The URL to fetch the category data from.
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */
export async function acquireCategoriesCollection(url) {
	const { data: { categorySchemes } } = await getJSONDataCache(url);

	const categoriesCollection = categorySchemes.flatMap(processCategoryScheme);


	return categoriesCollection;

	function processCategoryScheme({ categories, id: categorySchemeId }) {
		return categories.flatMap((category) => processCategory(category, categorySchemeId));
	}

	function processCategory( { id, name, categories: subCategories, links }, categorySchemeId) {
		const items = subCategories ? subCategories.map((subCategory) => processSubCategory(subCategory, categorySchemeId)) : [];
		items.push({ id, name, categorySchemeId, link: links[0].urn });
		return items;
	}

		function processSubCategory({ id, name, links }, categorySchemeId) {
		return { id, name, categorySchemeId, link: links[0].urn };
	}
}

/**
 * Creates a unique concept collection by processing the provided artefact and accumulating concepts.
 *
 * @param {Object} accumulatedConcept - The accumulated concepts so far.
 * @param {object} artefact - The artefact containing information about the concept.
 * @property {string} dsId - The structure ID.
 * @property {string} dfId - The dataflow ID.
 * @property {Object} concepts - The concepts in the artefact.
 * @property {Object} description - The descriptions of the concepts.
 * @property {Object} name - The names of the concepts.
 *
 * @returns {Object} The updated collection of unique concepts.
 *
 * Each concept in the collection includes:
 * - name: The name of the concept.
 * - description: The description of the concept. Defaults to "no description" if not provided.
 * - representation: Indicates how the concept data is represented. Can be "codes", "string", "integer",
 *                   "no format", or "mixed". Latter is used when representation changes over the time'
 * - conceptRoles: Is a reference to the General Concepts. We filter the list of concept roles. Only includes "SEX" and "AGE".
 * - dsd: An array of objects, each containing the dataflow ID, structure ID, and code list ID.
 * - appearance: An object indicating whether the concept uses codes or text in the artefact.
 *               Represented by "c" for codes and "t" for text.
 */
export function createUniqueConceptCollection(accumulatedConcept, artefact) {
	const { dsId, dfId, concepts, description, name } = artefact;

	Object.keys(concepts).forEach((conceptId) => {
		const concept = concepts[conceptId];
		const clId = concept.id || '';

		const newEntry = {
			name: name[conceptId].name,
			description: description[conceptId]?.description || "no description",
			representation: clId ? "codes" : concept.textType || "no format",
			conceptRoles: (concept.conceptRoles || []).filter(role => ["SEX","AGE"].includes(role)),
			dsd: [{
				dfId: dfId,
				dsId: dsId,
				clId: clId,
			}]
		};

		let existingConcept = accumulatedConcept[conceptId];
		if (existingConcept) {
			existingConcept.dsd.push(newEntry.dsd[0]);
			if ((newEntry.representation === "codes") ^ (existingConcept.representation === "codes")) {
				existingConcept.representation = "mixed";
			}
		} else {
			existingConcept = newEntry;
			existingConcept.appearance = {};
			accumulatedConcept[conceptId] = existingConcept;
		}
		existingConcept.appearance[dfId] = clId ? "c" : "t";
	});

	return accumulatedConcept;
}

/**
 * Retrieves the appearances of countries in the provided list of dataflow IDs.
 *
 * @param {Array} dfIdFilteredLis - The list of dataflow IDs to filter by.
 *
 * @returns {Array} An array of objects, each representing a country and its appearances in the dataflows.
 * @property {string} countryCode - The country code.
 * @property {Object} dfIds - An object where each key is a dataflow ID and the value is "x" if the country appears in that dataflow.
 */
export function getCountryAppearances(dfIdFilteredLis) {
	const artefactsCollection = getStorageData(sessionKeys.artefactsCollection);

	const countryAppearances = artefactsCollection.reduce((acc, {dfId, provisionAgreementCountries}) => {
		if (dfIdFilteredLis.length === 0 || dfIdFilteredLis.includes(dfId)) {
			provisionAgreementCountries.forEach(countryCode => {
				if (!acc[countryCode]) { acc[countryCode] = {} }
				acc[countryCode][dfId] = "x";
			});
		}
		return acc;
	}, {});

	return Object.entries(countryAppearances).map(([countryCode, dfIds]) => ({
		countryCode,
		...dfIds
	}));
}