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
	const yearsCount = new Map();
	const dfIdParameters = dfIds.map((dfId) => {
		const parameters = extractDfIdParameters(artefactsCollection, dfId);
		yearsCount.set(parameters.MICRODATA_COLLECTION_YEAR,
			(yearsCount.get(parameters.MICRODATA_COLLECTION_YEAR) || 0) + 1);
		return parameters;
	});

	const rowspans = ["id", "Code Name"].map(key => `<th rowspan='3'>${key}</th>`);
	const row1 = Array.from(yearsCount.keys()).map(key => `<th colspan='${yearsCount.get(key)}'>${key}</th>`);
	const row2 = getSecondRow(dfIdParameters);
	const row3 = dfIdParameters.map(parameters => `<th>${parameters.MICRODATA_DOMAINS}</th>`);

	const headers = ["<tr>"].concat(rowspans, row1, ["</tr><tr>"], row2, ["</tr><tr>"], row3, ["</tr>"]);
	return headers;
}
/**
 * Generates the second row of a table based on the given dfIdParameters.
 * @param {Array} dfIdParameters - An array of parameters for the table rows.
 * @returns {Array} An array representing the second row of the table.
 */
function getSecondRow(dfIdParameters) {
	let row2 = [];
	let previousHeader = null;
	let colspan = 1;

	for (const parameters of dfIdParameters) {
		if (previousHeader && parameters.MICRODATA_FILE_TYPE === previousHeader.MICRODATA_FILE_TYPE) {
			colspan++;
		} else {
			if (previousHeader) {
				row2.push(`<th colspan='${colspan}'>${previousHeader.MICRODATA_FILE_TYPE}</th>`);
			}
			previousHeader = parameters;
			colspan = 1;
		}
	}

	if (previousHeader) {
		row2.push(`<th colspan='${colspan}'>${previousHeader.MICRODATA_FILE_TYPE}</th>`);
	}

	return row2;
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
 * Extracts provision agreements for a given concept ID from artefact constraints.
 * @param {object} artefactConstraints - The artefact constraints object containing cube regions.
 * @param {string} conceptId - The concept ID to extract provision agreements for.
 * @returns An object with included and excluded country codes based on provision agreements.
 */
function extractProvisionAgreements(artefactConstraints, conceptId) {
	const agreedCountryCodes = { includedCodes: [], excludedCodes: [] };

	artefactConstraints.cubeRegions.forEach(region => {
		const { isIncluded, provisionAgreements } = region;
		const [anyKey] = Object.keys(provisionAgreements);
		if (provisionAgreements[anyKey].hasOwnProperty(countryCode)) {
			const codes = extractAgreementObjects(provisionAgreements, conceptId);
			if (codes) {
				if (isIncluded) {
					agreedCountryCodes.includedCodes.push(...codes);
				} else {
					agreedCountryCodes.excludedCodes.push(...codes);
				}
			}
		}
	});

	return {
		included: agreedCountryCodes.includedCodes.length > 0 ? agreedCountryCodes.includedCodes : null,
		excluded: agreedCountryCodes.excludedCodes.length > 0 ? agreedCountryCodes.excludedCodes : null
	};
}

function extractAgreementObjects(provisionAgreements, conceptId) {
	const conceptAgreement = provisionAgreements[conceptId];
	return conceptAgreement ? Object.values(conceptAgreement).flat() : null; 
}

function getConceptCodes(artefact, clId) {
	return artefact.codes[clId].codes;
}

function checkConstraints(artefact, conceptId, code) {
	return (
		!artefact.constraints ||
		!artefact.constraints[conceptId] ||
		artefact.constraints[conceptId].includes(code)
	);
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
function filterAndTransformConceptCodes(conceptCodes, artefact, conceptId, countryAgreement, isIncluded = true) {
	if (countryCode === "codes") {
		return Object.entries(conceptCodes)
			.filter(([code]) => checkConstraints(artefact, conceptId, code))
			.map(([code, name]) => ({ code, name }));
	}

	const countryAgreementSet = new Set(countryAgreement);

	return Object.entries(conceptCodes)
		.filter(([code]) => {
			const passesConstraints = checkConstraints(artefact, conceptId, code);
			if (!passesConstraints) return false;
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
function applyConstraints(artefact, conceptId, codeListId, accumulatedConceptData) {
	const artefactConstraints = findDfIdConstraints(artefact);
	if (!artefactConstraints) return;

	const provisionAgreements = extractProvisionAgreements(artefactConstraints, conceptId);
	const conceptCodes = getConceptCodes(artefact, codeListId);

	const addFilteredCodes = (codes, isIncluded = true) => {
		const filteredCodes = filterAndTransformConceptCodes(conceptCodes, artefact, conceptId, codes, isIncluded);
		accumulatedConceptData.codes = accumulatedConceptData.codes.concat(filteredCodes);
	};

	if (provisionAgreements.included) {
		addFilteredCodes(provisionAgreements.included);
	}
	if (provisionAgreements.excluded) {
		addFilteredCodes(provisionAgreements.excluded, false);
	}
	if (countryCode === "codes") {
		addFilteredCodes(countryCode);
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
