/**
 * sessionStorageKeys.js
 * Constants for cache names and session keys used in the application.
 */
export const cacheName = "sdmx-concept-navigator-cache";
export const sessionKeys = {
	dfIdsFiltered: "filteredDataFlowIds",
	dfIdsAll: "allDataFlowIds",
	dataFlowCollection: "dataFlowCollection",
	uniqueConcepts: "derivedUniqueConcepts",
	dsLinkingDf: "dataStructureLinkingDataFlow",
	constraintCollection: "constraintCollection",
	dataCategory: "dataCategory",
};

/**
# Session Keys Documentation

The `sessionKeys` object is used to define keys for session storage. The storage itself contains various types of data, including simple objects and lists of objects.

## Keys associated with the following cache objects:

- `dfIdsFiltered`: This is a list of filtered data flow IDs. Filtering is done by the user form submission. The cache value is an array of ID strings.

- `dfIdsAll`: This is a list of all available data flow IDs. I.e. - the category scheme retrieved artefacts. The cache value is an array of ID strings.

- `dataFlowCollection`: This is a collection of data flow objects. The cache value is an array of objects, where each object represents a data of dataflow.

- `uniqueConcepts`: This is a derived unique concepts object. The cache value is a single object that represents a unique concepts derived from artefacts.

- `dsLinkingDf`: This is a collection of structure linking objects. The cache value is an array of objects, where each object has links between dataflow and DSD.

- `constraintCollection`: This a collection of constraint objects. The cache value is an array of objects, where each object represents a data collection constraints in the country level. The object has also a data flow constraint, but it is not used in the version of this code.

- `dataCategory`: This is a data category object. The cache value is a single object that represents a data category retrieved from the category scheme artefact.

 */