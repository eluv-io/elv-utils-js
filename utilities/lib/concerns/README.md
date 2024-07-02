# elv-utils-js/lib/concerns

This directory contains code modules that group together functionality related to particular **concerns**. They are designed to be composable.

 * A **concern** may be as narrow as a single command line argument (e.g. `--objectId`).
 * A **concern** may be wide-ranging (e.g. working with metdata).
 * A **concern** may include other **concerns** (e.g. the `ExistLib` **concern** supports operations on an existing Fabric Library, and directly imports the `ArgLibraryId`, `FabricObject`, and `Library` **concerns**.) 
 * Most of the **utilities** in `elv-utils-js` import one or more **concerns**

The subdirectories divide up concerns as follows:

 * `/args/` - Concerns that define a single command line argument. Each file is named "Arg" + the name of the argument in UpperPascalCase (e.g. `ArgObjectId.js` for `--objectId`)
 * `/kits/` - Concerns that group together one or more command line arguments with functions related to carrying out operations controlled by them
 * `/libs/` - Concerns that do not directly define command line arguments (although currently many of them will wind up indirectly defining the arguments for `Client` and `Logger`) and contain functions that are not directly aware of any command line arguments.

