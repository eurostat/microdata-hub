### Overview
The `createConceptsTables.js` module creates and manages a table of concepts and their details using the DataTables library. It fetches necessary data from an API via the `dataFetcher` module and includes functionality for filtering, searching, and expanding rows to show additional details.

### Key Functions

1. **`initializeConceptsTable(conceptDataForRows)`**
   - **Purpose:** Initializes the main concepts table with interactive features.
   - **Parameters:** `conceptDataForRows` - Data to populate the table rows.
   - **Returns:** A function to update the table with new data.
   - **Features:**
     - Sets up the table with headers, footers, and filters.
     - Adds click handlers for expanding rows to show detailed information.

2. **`generateTableHeaderAndFooter(artefactsCollection, dfIdFullList)`**
   - **Purpose:** Generates headers and footers for the concepts table based on artefact data.
   - **Parameters:** `artefactsCollection` - Data of all artefacts, `dfIdFullList` - List of dataflow IDs.

3. **`extractCountryCodes(conceptId)`**
   - **Purpose:** Extracts unique country codes associated with a given concept ID.
   - **Parameters:** `conceptId` - The ID of the concept.

4. **`buildTableRow(label, value)`**
   - **Purpose:** Builds an HTML table row.
   - **Parameters:** `label` - The label for the row, `value` - The value for the row.

5. **`generateChildRowView(rowData)`**
   - **Purpose:** Generates the detailed child row view for a concept.
   - **Parameters:** `rowData` - Data for the parent row.
   - **Features:**
     - Displays additional details such as descriptions, roles, and country-specific constraints.

6. **`createDataActionButtons(array, conceptId)`**
   - **Purpose:** Creates action buttons for country-specific data constraints.
   - **Parameters:** `array` - List of countries or codes, `conceptId` - The concept ID.

7. **`attachClickHandlersToDataActionButtons(artefactsCollection)`**
   - **Purpose:** Attaches click handlers to buttons for opening a modal with detailed information.
   - **Parameters:** `artefactsCollection` - Data of all artefacts.

### Usage
1. Call `initializeConceptsTable` with the concept data to set up the main table.
2. Use the returned function to update the table with new data when necessary.
3. Click on a table row to expand and view more details.

This module provides a dynamic, interactive way to manage and display a complex dataset of concepts and their associated details.