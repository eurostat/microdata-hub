/** createCodesTable.js
 * is responsible for creating the codes table in the modal.
 * The module exports a function that initializes the codes table with data.
 * The module uses the transposeDataForDataTable function to prepare the data for the table.
 */
import { sessionKeys } from "./sessionStorageKeys.js";
import { getStorageData } from "./utils.js";
let countryCode = "";

/**
 * Creates a codes table based on the artefacts collection, concept ID, and country.
 * @param {Array} artefactsCollection - The collection of artefacts to display in the table.
 * @param {string} conceptId - The ID of the concept associated with the artefacts.
 * @param {string} country - The country code to set for the table.
 * @returns The DataTable object representing the codes table.
 */
export function createCodesTable(artefactsCollection, conceptId, country) {
	countryCode = country;
	$("#codes-table").DataTable().destroy();
	$("#codes-table tbody").empty();
	$("#codes-table thead tr").empty();

	const artefactsCodeAppearances = artefactsCollection.map((artefact) =>
		processArtefactForCodesTable(artefact, conceptId)
	);

	const headers = generateTableHeaders(artefactsCodeAppearances, artefactsCollection);

	return $("#codes-table").DataTable({
		columnDefs: [
			{ width: "10%",targets: 0, type: "string"},
			{ width: "80%", targets: 1, type: "string"},
			{ width: "10%", targets: 2 },
		],
		initComplete: function () {
			this.api()
				.columns()
				.data()
				.each((value, index) => {
					// Check if all values in the column are empty or undefined
					const isEmptyColumn = value.every(cellValue => cellValue === "" || cellValue === undefined);

					if (isEmptyColumn) {
						this.api().column(index).visible(false);
					}
				});
		},
		data: buildCodeAppearanceRows(artefactsCodeAppearances),
		columns: headers.map(function (col) {
			return { data: col, defaultContent: '' };
		}),
		scrollY: "45vh",
		scrollCollapse: true
	});
}

/**
 * Generates table headers based on the provided table rows and artefacts collection.
 * @param {Array} tableRows - The array of table rows containing artefact information.
 * @param {Array} artefactsCollection - The collection of artefacts.
 * @returns {Array} An array of column names for the table headers.
 */
function generateTableHeaders(tableRows, artefactsCollection) {
	const dfIds = tableRows
		.filter(artefact => artefact.codes.length > 0)
		.map(artefact => artefact.dfId);

	const headers = buildTableHeaderRows(artefactsCollection, dfIds);
	$("#codes-table thead").html(headers.join(""));

	const cols = ["code", "name", ...dfIds];
	return cols;
}

/**
 * Builds the header rows for a table based on the artefacts collection and dataflow IDs provided.
 * @param {object} artefactsCollection - The collection of artefacts.
 * @param {array} dfIds - An array of dataflow IDs.
 * @returns {array} An array of strings representing the header rows for the table.
 */
function buildTableHeaderRows(artefactsCollection, dfIds) {
	const dfIdParameters = dfIds.map((dfId) => {
		const parameters = extractDfIdParameters(artefactsCollection, dfId);
		return parameters;
	});

	const headers = dfIdParameters.map(parameters => {
		const parts = parameters.MICRODATA_DOMAINS.split('_');
		const lastPart = parts.pop();
		const year = parameters.MICRODATA_COLLECTION_YEAR;
		const fileType = parameters.MICRODATA_FILE_TYPE;
		return `<th>${year} ${fileType} ${1 ? parameters.MICRODATA_DOMAINS : lastPart}</th>`;
	});

	const rowspans = ["id", "Code Name"].map(key => `<th>${key}</th>`);
	const finalHeaders = ["<tr>"].concat(rowspans, headers, ["</tr>"]);
	return finalHeaders;
}
/**
 * Extracts parameters based on the dfId from the artefacts collection.
 * @param {Array} artefactsCollection - The collection of artefacts to search through.
 * @param {string} dfId - The dfId to match and extract parameters for.
 * @returns {Object|null} - The parameters object extracted based on the dfId, or null if no artefact is found.
 */
function extractDfIdParameters(artefactsCollection, dfId) {
	const artefact = artefactsCollection.find(artefact => artefact.dfId === dfId);

	if (!artefact) return null;

	const parameters = artefact.categories.reduce((acc, category) => {
		Object.keys(category).forEach(categorisationSchemeKey => {
			acc[categorisationSchemeKey] = category[categorisationSchemeKey].id;
		});
		return acc;
	}, {});

	return parameters;
}

/**
 * Processes an artefact to generate data for a codes table based on the given concept ID.
 * @param {object} artefact - The artefact to process.
 * @param {string} conceptId - The concept ID to search for in the artefact.
 * @returns {object} The accumulated concept data structure for the codes table.
 */
function processArtefactForCodesTable(artefact, conceptId) {
	const accumulatedConceptData = initializeEmptyConceptDataStructure(artefact);
	const conceptExists = hasConcept(artefact, conceptId);

	if (conceptExists) {
		handleConceptExists(artefact, conceptId, accumulatedConceptData);
	}

	return accumulatedConceptData;
}

function initializeEmptyConceptDataStructure(artefact) {
	return { dfId: artefact.dfId, codes: [] };
}

function hasConcept(artefact, conceptId) {
	return artefact.concepts.hasOwnProperty(conceptId);
}

function handleConceptExists(artefact, conceptId, accumulatedConceptData) {
	const clId = artefact.concepts[conceptId].id;
	const codesExist = artefact.codes?.[clId];

	if (codesExist) {
		applyConstraints(artefact, conceptId, clId, accumulatedConceptData);
	} else {
		accumulatedConceptData[conceptId] = "";
	}
}

function findDfIdConstraints(artefact) {
	const constraintsCollection = getStorageData(sessionKeys.constraintCollection);
	const dfIdConstraints = constraintsCollection.find((constraintObj) => constraintObj.dfId === artefact.dfId);
	if (!dfIdConstraints) {
		console.error(`No element found with dfId: ${artefact.dfId}`);
		return null;
	}
	return dfIdConstraints;
}

/**
 * Extracts constraints from ether provision agreements or from dataflows for a specific concept ID within artefact constraints.
 * @param {object} artefactConstraints - The artefact constraints object containing cube regions.
 * @param {string} conceptId - The concept ID to extract provision agreements for.
 * @returns An object with included and excluded codes based on the concept ID.
 */
function extractConstraintsForConcept(artefactConstraints, conceptId) {
	const match = { includedCodes: [], excludedCodes: [] };

	artefactConstraints.cubeRegions.forEach(region => {
		const { isIncluded, provisionAgreements, dataflows } = region;

		const constraints = provisionAgreements || dataflows;

		if (isCurrentCountry(constraints)) {
			const codes = extractAgreementObjects(constraints, conceptId);
			if (codes) {
				if (isIncluded) {
					match.includedCodes.push(...codes);
				} else {
					match.excludedCodes.push(...codes);
				}
			}
		}
	});

	return {
		included: match.includedCodes.length > 0 ? match.includedCodes : null,
		excluded: match.excludedCodes.length > 0 ? match.excludedCodes : null
	};
}

function isCurrentCountry(constraints) {
	const [anyKey] = Object.keys(constraints);
	const region = countryCode === "codes" ? "ALL" : countryCode
	return constraints[anyKey].hasOwnProperty(region);
}

function extractAgreementObjects(provisionAgreements, conceptId) {
	const conceptAgreement = provisionAgreements[conceptId];
	return conceptAgreement ? Object.values(conceptAgreement).flat() : null; 
}

function getConceptCodes(artefact, clId) {
	return artefact.codes[clId].codes;
}


/**
 * Filters and transforms concept codes based on the provided parameters.
 * @param {Object} conceptCodes - An object containing concept codes and their names.
 * @param {string} artefact - The artefact to check constraints against.
 * @param {string} conceptId - The concept ID to check constraints against.
 * @param {string[]} countryAgreement - An array of country agreements.
 * @param {boolean} [isIncluded=true] - Flag to determine if the code should be included or excluded.
 * @returns An array of objects containing filtered concept codes and their names.
 */
function filterAndTransformConceptCodes(conceptCodes, countryAgreement, isIncluded = true) {
	const countryAgreementSet = new Set(countryAgreement);

	return Object.entries(conceptCodes)
		.filter(([code]) => {
			return isIncluded ? countryAgreementSet.has(code) : !countryAgreementSet.has(code);
		})
		.map(([code, name]) => ({ code, name }));
}

/**
 * Apply constraints to the artefact based on the provided conceptId, codeListId, and accumulatedConceptData.
 * @param {any} artefact - The artefact to apply constraints to.
 * @param {string} conceptId - The concept ID to use for constraints.
 * @param {string} codeListId - The code list ID to use for constraints.
 * @param {object} accumulatedConceptData - The accumulated concept data object to store the filtered codes.
 * @returns None
 */
function applyConstraints(
	artefact,
	conceptId,
	codeListId,
	accumulatedConceptData
) {
	const artefactConstraints = findDfIdConstraints(artefact);
	if (!artefactConstraints) return;

	const constraints = extractConstraintsForConcept(artefactConstraints, conceptId);
	const conceptCodes = getConceptCodes(artefact, codeListId);

	const addFilteredCodes = (codes, isIncluded = true) => {
		const filteredCodes = filterAndTransformConceptCodes(
			conceptCodes,
			codes,
			isIncluded
		);
		accumulatedConceptData.codes =
			accumulatedConceptData.codes.concat(filteredCodes);
	};

	if (constraints.included) {
		addFilteredCodes(constraints.included);
	} else if (constraints.excluded) {
		addFilteredCodes(constraints.excluded, false);
	} else {
		addFilteredCodes([], false);
	}
}

/**
 * Builds an array of code appearance rows based on the artefact code appearances provided.
 * The unique combinations of code and name are used to create the rows.
 * @param {Array} artefactCodeAppearances - An array of artefact code appearances.
 * @returns {Array} An array of code appearance rows with unique combinations of code and name.
 */
function buildCodeAppearanceRows(artefactCodeAppearances) {
	const codeMap = artefactCodeAppearances.reduce((acc, artefact) => {
		const dfId = artefact.dfId;
		const codes = artefact.codes;

		codes.forEach((codeObj) => {
			const code = codeObj.code;
			const name = codeObj.name;
			const combination = `${code}_${name}`;

			if (!acc[combination]) {
				acc[combination] = { code: code, name: name };
			}
			acc[combination][dfId] = "x";
		});

		return acc;
	}, {});

	return Object.values(codeMap);
}
