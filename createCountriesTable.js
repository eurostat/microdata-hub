/** "createCountriesTable.js"
 * is responsible for creating the Countries Participation Data view. 
*/
import { getStorageData } from "./utils.js";
import { extractLabelFromDsId } from "./utils.js";
import { sessionKeys } from "./sessionStorageKeys.js";

/**
 * Initializes a DataTable with the provided countries data and table headers.
 * @param {Array} countriesDataForRows - The data to populate the table rows.
 * @param {Array} dfIds - The filtered data frame IDs to generate table headers.
 * @returns {DataTable} - The initialized DataTable object.
 */
export function initializeCountriesTable(countriesDataForRows, dfIds) {
  const placeholder = document.querySelector("#countries-table > table");
  const tableHeaders = generateTableHeader(dfIds);
  const table = new DataTable(placeholder, {
    data: countriesDataForRows,
    columns: tableHeaders,
    paging: true,
    pageLength: 50,
    searching: true,
    autoWidth: true,
  });

	function updateCountriesTable(tableRows) {
		table.clear();
		table.rows.add(tableRows);
		table.draw();
		setColumnVisibility();
	}
	function setColumnVisibility() {
		table.columns().data().each(function (value, index) {
			if (index < 1) return; // Skip the first column

			// Check if all values in the column are empty or undefined
			var isEmptyColumn = value.every(function (cellValue) {
				return cellValue === "" || cellValue === undefined;
			});

			if (isEmptyColumn) {
				table.column(index).visible(false); // Hide the column
			} else {
				table.column(index).visible(true); // Show the column
			}
			
		});
	}

  return updateCountriesTable;
}

/**
 * Generates the table header for a given set of filtered data frame IDs.
 * @param {Array} dfIds - An array of filtered data frame IDs.
 * @returns An array of table headers with titles, data, default content, and class names.
 */
function generateTableHeader(dfIds) {
  const dsLinkingDf = getStorageData(sessionKeys.dsLinkingDf);
  const dsIdLookup = dsLinkingDf.reduce((lookup, { dfId, dsId }) => {
    lookup[dfId] = dsId;
    return lookup;
  }, {});

  const artefacts = dfIds.map(dfId => ({
    title: extractLabelFromDsId(dsIdLookup[dfId]),
    data: dfId,
    defaultContent: "",
  }));

  const headers = [
    {
      title: "Country code",
      data: "countryCode",
    },
    ...artefacts,
  ];
  const headerRows = headers
    .map(
      (header) =>
        `<th class="${header.data === 'countryCode' ? '' : 'rotate-180'}">${header.title}</th>`
    )
    .join("");
  $("#countries-table > table > thead").append(`<tr>${headerRows}</tr>`);
  return headers;
}
