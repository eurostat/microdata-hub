// "mainDataTableProducer.js" 

/**
 * The above functions prepare and generate a main table with data by fetching, filtering, and parsing
 * data from different sources.
 */
import { requestCategorySchemeData, fetchAndFilterArtefactsCollection } from "./dataFetcher.js";
import {getCountryAppearances, createUniqueConceptCollection } from "./dataParser.js";
import { initializeConceptsTable } from "./createConceptsTable.js";
import { initializeCountriesTable } from "./createCountriesTable.js";
import { setStorageData } from "./utils.js";
import { sessionKeys } from "./sessionStorageKeys.js";

/**
 * Asynchronously prepares table rows based on the provided data frame IDs.
 * @param {Array} dfIds - An array of data frame IDs to retrieve artefacts.
 * @returns {Array} An array of table rows containing information about unique concepts.
 */
export async function fetchAndProcessConceptTableData(dfIds) {
  const artefactsCollectionFiltered = await fetchAndFilterArtefactsCollection(dfIds);
  const uniqueConceptsObject = artefactsCollectionFiltered.reduce(createUniqueConceptCollection, {});
  setStorageData(sessionKeys.uniqueConcepts, uniqueConceptsObject);
  const conceptDataForRows = Object.entries(uniqueConceptsObject).map(
		([conceptId, dsObj]) => {
			return {
        conceptRoles: dsObj.conceptRoles.join(", "),
				description: dsObj.description,
        conceptId: conceptId,
        conceptName: dsObj.name,
        ...dsObj.appearance,
			};
		}
	);
  return conceptDataForRows;
}

/**
 * Creates and populates the main tables with data fetched from various sources.
 * @returns An object containing the updates made to the concept table and countries table.
 */
export async function createAndPopulateMainTables() {
  const mapDataflowsToStructure = await requestCategorySchemeData();
  const dfIdFullList = mapDataflowsToStructure.map((link) => link.dfId);
  setStorageData(sessionKeys.dfIdsFiltered, dfIdFullList);
  setStorageData(sessionKeys.dfIdsAll, dfIdFullList);
  const conceptDataForRows = await fetchAndProcessConceptTableData(dfIdFullList);
  const updateConceptTable = await initializeConceptsTable(conceptDataForRows);
  const countryDataForRows = getCountryAppearances([]);
  const updateCountriesTable = initializeCountriesTable(countryDataForRows, dfIdFullList);
  return {updateConceptTable, updateCountriesTable};
}