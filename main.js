//main.js
import { createAndPopulateMainTables, fetchAndProcessConceptTableData } from "./mainDataTableProducer.js";
import { microdataSelectionForm } from "./createCategorisationForm.js";
import { getDataflowIdsMatchingFormValues, setConstraintsCollection, getCategorySchemeData } from "./dataFetcher.js";
import { createSelectElement, createDropdownLabel, createFlexContainer, setStorageData } from "./utils.js";
import { sessionKeys, cacheName } from "./sessionStorageKeys.js";
import {getCountryAppearances } from "./dataParser.js";

// clear session storage and cache if the URL parameter "clear" or "purge" is present
handleDebugURLParameters();

// retrieve the category scheme data and store it in session storage
const categorySchemeData = await getCategorySchemeData();
sessionStorage.setItem(sessionKeys.dataCategory, JSON.stringify(categorySchemeData));

// Call the asynchronous function to render the header form with dropdown selections
await microdataSelectionForm(categorySchemeData);

// Call the function to initialize the table toggle button 
initializeTableToggleButton();

// Call the asynchronous function to generate the main table with data and store the updateDataTable functions
const {updateConceptTable, updateCountriesTable} = await createAndPopulateMainTables();

// Get the form element and add an event listener for form submission
const form = document.querySelector("#category-form");
form.addEventListener("submit", microdataFormEventHandler);

// Call the asynchronous function to get the provision agreement data
export const dfIdFullList = JSON.parse(sessionStorage.getItem(sessionKeys.dfIdsAll));

await setConstraintsCollection(dfIdFullList, true);

function handleDebugURLParameters() {
	const params = new URLSearchParams(window.location.search);

	if (params.has('clear')) {
		console.log('clearing session storage');
		sessionStorage.clear();
	}
	sessionStorage.removeItem('dfIdFilteredList');

	if ('caches' in window && params.has('purge')) {
		caches.keys().then(names => {
			names.forEach(name => {
				if (name === cacheName) {
					console.log('deleting cache', name);
					caches.delete(name);
				}
			});
		});
	}
}

// Define an async function to handle the form submission
async function microdataFormEventHandler(event) {
	// Prevent the default form submission behavior
	event.preventDefault();

	// Get the form data
	const form = document.querySelector("#category-form");
	const formData = new FormData(form);
	const formValuesMap = {};

	// Iterate over each form control in the form
	formData.forEach((value, key) => {
		const element = form.elements[key];

		// Check if the element is a select element and the selected option has a non-empty value attribute
		if (element && element.tagName === "SELECT") {
			const selectedOption = element.options[element.selectedIndex];
			if (
				selectedOption &&
				selectedOption.hasAttribute("value") &&
				selectedOption.getAttribute("value") !== ""
			) {
				formValuesMap[key] = value;
			}
		} else {
			formValuesMap[key] = value;
		}
	});

	try {
		// Call the asynchronous function to get data flow IDs matching the form values
		const dfIdFilteredList = await getDataflowIdsMatchingFormValues(
			formValuesMap
		);
		setStorageData(sessionKeys.dfIdsFiltered, dfIdFilteredList);
		const conceptTableRows = await fetchAndProcessConceptTableData(dfIdFilteredList);
		updateConceptTable(conceptTableRows);
		const countryTableRows = getCountryAppearances(dfIdFilteredList);
		updateCountriesTable(countryTableRows);
	} catch (error) {
		console.error("An error occurred:", error);
		// Handle errors if any
	}
}
/**
 * Creates a view toggle dropdown menu with options for selecting different views.
 * @returns The select element of the view toggle dropdown menu.
 */
function createViewToggleDropdown() {
	const id = "view-toggle";
	const labelText = "Table View Selector";
	const select = createSelectElement(labelText, id)
		.append(new Option("Usage of variables", "variables"))
		.append(new Option("Participation of Countries", "countries"));
	const label = createDropdownLabel(labelText, id)
	const flexContainer = createFlexContainer().append(label, select);

	$("#view-toggle-container").append(flexContainer);
	return select;
}
/**
 * Initializes the table toggle button functionality.
 * This function creates a view toggle dropdown, selects the concepts and country tables,
 * and sets up event listeners to toggle between them based on the dropdown selection.
 * @returns None
 */
export function initializeTableToggleButton() {
  const viewToggleDropdown = createViewToggleDropdown();
  const conceptsTable = $("#concepts-table");
  const countryTable = $("#countries-table");
  const generalConceptsDropdown = $("#general-concepts-container");
  countryTable.hide();

  // Handle dropdown selection
  viewToggleDropdown.change(() => {
    const isVariablesSelected = viewToggleDropdown.val() === 'variables';

    conceptsTable.toggle(isVariablesSelected);
    countryTable.toggle(!isVariablesSelected);
    generalConceptsDropdown.toggle(isVariablesSelected);
  });

  // Trigger change event to set initial view
  viewToggleDropdown.trigger('change');
}