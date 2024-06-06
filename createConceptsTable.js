/** 
 * "createConceptsTables.js"
 * is a module that creates the concepts table and the child row with concept details.
 * It uses the DataTables library to create the tables and the dataFetcher module to fetch the data from the API.
 * The module exports a function that creates the concepts table and returns a function
 * that updates the concepts table with new data.
 * The module also exports a function that creates the child row, when a concept row is clicked.
 * The module uses the createCodesTable module to create the codes table in the modal.
 */

import { fetchAndFilterArtefactsCollection } from "./dataFetcher.js";
import {
	getStorageData,
	createSelectElement,
	createDropdownLabel,
	createFlexContainer,
	addChangeListenerToSelect,
	addOptionsToSelect,
	extractLabelFromDsId,
} from "./utils.js";
import { sessionKeys } from "./sessionStorageKeys.js";
import { createCodesTable } from "./createCodesTable.js";

/**
 * Initializes the concepts table with the provided concept data for rows.
 * @param {Array} conceptDataForRows - The data to populate the table rows.
 * @returns {Function} - An update function to update the parent data table.
 */
export async function initializeConceptsTable(conceptDataForRows) {
	const placeholder = document.querySelector("#concepts-table > table");
	const dfIdFullList = getStorageData(sessionKeys.dfIdsAll);
	const artefactsCollection = await fetchAndFilterArtefactsCollection(dfIdFullList);
	const tableHeaders = generateTableHeaderAndFooter(artefactsCollection, dfIdFullList);	

	const parentTable = new DataTable(placeholder, {
		initComplete: function () {
			this.api()
				.columns()
				.every(function (index) {
					let column = this;

					if (index === 1) {
						const id = "generalConceptFilter";
						const title = "General Concept Selector";
						const select = createSelectElement(title, id).append(new Option("-"));
						const label = createDropdownLabel(title, id);
						const flexContainer = createFlexContainer().append(label, select);

						$("#general-concepts-container").append(flexContainer);

						addChangeListenerToSelect(select, column);
						addOptionsToSelect(select, column);
					}

					if (index === 2 || index === 3) {
						const title = $(column.footer()).text();
						const input = $('<input>').attr('placeholder', title);
						$(column.footer()).empty().append(input);

						input.on('keyup', function() {
							if (column.search() !== this.value) {
								column.search(this.value).draw();
							}
						});
					}

					if (index >= 4) {
						const select = createSelectElement("Data Filter", "").append(new Option(""));
						$(column.footer()).empty().append(select);
						addChangeListenerToSelect(select, column);
						addOptionsToSelect(select, column);
					}
				});
		},
		columnDefs: [
			{
				targets: 0,
				className: "dt-control",
				orderable: false,
				data: null,
			},
			{ targets: 1, visible: false },
		],
		data: conceptDataForRows,
		columns: tableHeaders,
	});

	parentTable.on("click", "td.dt-control", async function (e) {
		try {
			const tr = e.target.closest("tr");
			const row = parentTable.row(tr);

			if (row.child.isShown()) {
				row.child.hide();
			} else {
				row.child(generateChildRowView(row.data())).show();
				attachClickHandlersToDataActionButtons(artefactsCollection);
			}
		} catch (error) {
			console.error('An error occurred:', error);
		}
	});
	
	function updateParentDataTable(tableRows) {
		parentTable.clear();
		parentTable.rows.add(tableRows);
		parentTable.draw();
		setColumnVisibility();
	}

	function setColumnVisibility() {
		parentTable.columns().data().each(function (value, index) {
			if (index < 3) return; // Skip the first 3 columns

			// Check if all values in the column are empty or undefined
			var isEmptyColumn = value.every(function (cellValue) {
				return cellValue === "" || cellValue === undefined;
			});

			if (isEmptyColumn) {
				parentTable.column(index).visible(false); // Hide the column
			} else {
				parentTable.column(index).visible(true); // Show the column
			}
			
		});
	}

	return updateParentDataTable;
}

/**
 * Generates the header and footer for a table based on the artefacts collection and a list of dfIds.
 * @param {Array} artefactsCollection - The collection of artefacts.
 * @param {Array} dfIdFullList - The list of dfIds to generate the table columns.
 * @returns {Array} An array of column objects for the table.
 */
function generateTableHeaderAndFooter(artefactsCollection, dfIdFullList) {
	const dsIds = dfIdFullList.map((dfId) => {
		return artefactsCollection.find((artefact) => artefact.dfId === dfId).dsId;
	});
	setHeader();
	setFooter();
	const columns = [null, "conceptRoles", "conceptId", "conceptName", ...dfIdFullList].map((col) => ({
		data: col,
		defaultContent: "",
	}));
	return columns;

	function setHeader() {
		const headers = [
			{ title: "" },
			{ title: "roles" },
			{ title: "Variable ID" },
			{ title: "Variable Name", className: "min-width-200" },
			...dsIds.map((dsId) => ({
				title: extractLabelFromDsId(dsId),
				className: "rotate-180",
			})),
		];
		const headerRows = headers
			.map(
				(header) =>
					`<th class="${header.className || "concept-cell"}">${
						header.title
					}</th>`
			)
			.join("");
		$("#concepts-table > table > thead").append(`<tr>${headerRows}</tr>`);
	}

	function setFooter() {
		const footers = ["", "roles", "ID Search", "Name Search", ...dsIds.map(() => "")];
		const footerRows = footers.map((footer) => `<th>${footer}</th>`).join("");
		const footerElement = $("#concepts-table > table > tfoot");
		footerElement.append(`<tr>${footerRows}</tr>`);
	}
}


/**
 * Extracts country codes associated with a given concept ID from the constraints collection.
 * @param {string} conceptId - The concept ID for which country codes need to be extracted.
 * @returns {Array} An array of unique country codes associated with the concept ID.
 */
function extractCountryCodes(conceptId) {
	const constraintsCollection = getStorageData(sessionKeys.constraintCollection);
	return Array.from(constraintsCollection.reduce((acc, constraints) => {
		if (Array.isArray(constraints.countries[conceptId])) {
			constraints.countries[conceptId].forEach(geo => acc.add(geo));
		}
		return acc;
	}, new Set()));
}

function buildTableRow(label, value) {
	return `<tr><td width="15%">${label}</td><td width="85%">${value}</td></tr>`;
}

/**
 * Generates a child row view for a given row data object.
 * @param {Object} rowData - The data object containing information about the row.
 * @returns {string} - The HTML representation of the child row view.
 */
function generateChildRowView(rowData) {
	const {conceptRoles, description, conceptId, conceptName} = rowData;
	const constrainedCountryCodes = extractCountryCodes(conceptId);
	const uniqueConceptsObject = getStorageData(sessionKeys.uniqueConcepts);
	const representation = uniqueConceptsObject[conceptId].representation;
	const conceptHasCodes = ["mixed", "codes"].includes(representation);
	const conceptHasCodesMixed = representation === "mixed";

	const rows = [
		buildTableRow("ID", conceptId),
		buildTableRow("Name", conceptName),
		description !== "no description" && buildTableRow("Description", description),
		conceptRoles && buildTableRow("General Concepts", conceptRoles),
		conceptHasCodesMixed && buildTableRow("Data Representation", "This variable representation has changed over the time series, i.e. it has both codes and free text as values."),
		!conceptHasCodes && buildTableRow("Data Representation", "This variable representation has a free text as values."),
		conceptHasCodes && buildTableRow("Code List", createDataActionButtons(["codes"], conceptId)),
		constrainedCountryCodes.length > 0 && buildTableRow("Data Constraints", createDataActionButtons(constrainedCountryCodes, conceptId)),
	].filter(Boolean);

	return `<table class="table table-bordered child-table">${rows.join('')}</table>`;
}

/**
 * Creates an array of data action buttons based on the input array and concept ID.
 * @param {Array} array - The array of elements to create buttons for.
 * @param {string} conceptId - The concept ID to associate with the buttons.
 * @returns A string of HTML buttons with data attributes for each element in the array.
 */
function createDataActionButtons(array, conceptId) {
	return array
		.map(
			(el) =>
				`<button class="open-modal-button" data-concept-id="${conceptId}" data-country="${el}">${el}</button>`
		)
		.join("");
}

/**
 * Checks if the given element is fully visible within the viewport.
 * @param {Element} el - The element to check visibility for.
 * @returns {boolean} True if the element is fully visible, false otherwise.
 */
function isElementFullyVisible(el) {
	var rect = el.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

function attachClickHandlersToDataActionButtons(artefactsCollection) {
	const countryButtons = document.querySelectorAll(".open-modal-button");

	/** Since the modal is initially hidden, this event listener ensures
	 * column widths are adjusted upon modal visibility to prevent layout issues.
	 */ 
	$('#codes-table-modal').on('shown.bs.modal', function (e) {
		var checkVisibility = setInterval(function() {
			var table = document.getElementById('codes-table');
			if (isElementFullyVisible(table)) {
				$('#codes-table').DataTable().columns.adjust();
				clearInterval(checkVisibility);  // stop checking once the table is fully visible
			}
		}, 100);
	});

	countryButtons.forEach((button) => {
		button.addEventListener("click", async (e) => {
			const country = e.target.dataset.country;
			const conceptId = e.target.dataset.conceptId;

			createCodesTable(artefactsCollection, conceptId, country);

			$(".modal-title").text(`${conceptId} variable code list${country !== "codes" ? ` for "${country}"` : ""}`);	
			$("#codes-table-modal").modal("show");
		});
	});
}