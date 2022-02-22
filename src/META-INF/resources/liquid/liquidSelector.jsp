<!-- -->
<!-- START of Liquid Framework Selection Service Files ..  -->
<!-- -->
<script>
    liquidSelectDatabases = '<%=workspace.get_file_content(request, "/liquid/selector/liquidSelectDatabases.json")%>';
    liquidSelectSchemas = '<%=workspace.get_file_content(request, "/liquid/selector/liquidSelectSchemas.json")%>';
    liquidSelectTables = '<%=workspace.get_file_content(request, "/liquid/selector/liquidSelectTables.json")%>';
    liquidSelectTableColumns = '<%=workspace.get_file_content(request, "/liquid/selector/liquidSelectTableColumns.json")%>';
    liquidSelectForeignKeys = '<%=workspace.get_file_content(request, "/liquid/selector/liquidSelectForeignKeys.json")%>';
    liquidSelectForeignTablesAndLookups = '<%=workspace.get_file_content(request, "/liquid/selector/liquidSelectForeignTablesAndLookups.json")%>';
</script>
<!-- -->
<!-- END of Liquid Framework Selection Service Files -->
<!-- -->