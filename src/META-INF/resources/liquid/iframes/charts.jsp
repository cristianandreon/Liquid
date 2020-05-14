<%@ page 
    language="java" 
    contentType="text/html; charset=iso-8859-1" 
    import="javax.servlet.*"
    import="javax.servlet.http.*"
    import="javax.servlet.jsp.*"
    errorPage="" 
    %><%!
    %><%
    %>
<html>
    <head>
        <title>Liquid - Chart Manager</title>
        <script src="../.././liquid/Chart.js"></script>
        <link rel="stylesheet" href="../.././liquid/liquid.css" type='text/css' />
        <link rel="stylesheet" href="/LiquidX/liquid.css" type='text/css' />
        <script lang="javascript">            
                       
            var glLiquidServlet = "";
            var glChart = null;
            var glChartName = null;
            var glChartObj = null;
            var Liquid = window.parent.Liquid;
            
            function onLoad() {
                // init ... 
                const urlParams = new URLSearchParams(window.location.search);
                glChartName = urlParams.get('docName');
                glControlId = urlParams.get('controlId');
            }
            
            
            function addDocuemnts( docItems ) {
                var table = document.getElementById("liquidChartX.table");
            }
            
            function addDocuemnt( docItem ) {
                if(docItem) {
                    var container = document.getElementById("liquidChartX.container");
                    if(container) {
                    } else console.error("ERROR: target table not found")
                }
            }
            
            function loadChart( liquid, chart, nodes, mode ) {
                var owner = liquid.tableJson.owner + ".getDocuemnts";
                if(chart.owner) owner = chart.owner;
                if(!owner) owner = 'com.liquid.event.getDocuemnts';
                if(owner) { }

                var groupingColumn = null;                
                var labelsArray = [];
                if(chart.rows === '*') {
                    nodes = liquid.gridOptions.api.rowModel.rootNode.allLeafChildren;
                }
                var keyColField = liquid.tableJson.primaryKeyField ? liquid.tableJson.primaryKeyField : "1";
                var keyColIndex = Number(keyColField)-1;
                var columns = [];
                var types = [];
                if(chart.columns !== 'undefined' && chart.columns) {
                    if(Array.isArray(chart.columns) || chart.columns instanceof Array || chart.columns === '*') {
                        for(var ic=0; ic<chart.columns.length; ic++) {
                            var col = Liquid.getColumn(liquid, chart.columns[ic]);
                            columns.push( col );
                        }
                    } else if(typeof chart.columns === 'string') {
                        var col = Liquid.getColumn(liquid, chart.columns);
                        columns.push( col );
                    }
                } else {
                    columns.push( liquid.tableJson.columns[keyColIndex] );
                }
                if(chart.types !== 'undefined' && chart.types) {
                    if(Array.isArray(chart.types) || chart.types instanceof Array) {
                        for(var ic=0; ic<chart.types.length; ic++) {
                            types.push( chart.types[ic] );
                        }
                    } else if(typeof chart.types === 'string') {
                        types.push( chart.types );
                    }
                } else {
                    types.push( null );
                }
                chart.labelCol = null;
                if(chart.labelColumn !== 'undefined' && chart.labelColumn) {
                    chart.labelCol = Liquid.getColumn(liquid, chart.labelColumn);
                }

                if(columns.length == 1) {
                    if(!Liquid.isNumeric(columns[0].type)) {
                        groupingColumn = columns[0].name;
                    }                        
                }
                var chartType = chart.type;
                if(chartType === '' || chartType==='pie') chartType = 'doughnut';
                if(chartType === '' || chartType==='histogram') chartType = 'bar';
                /* 'line','bar',horizontalBar','verticalBar','radar','doughnut','polar area','bubble','scatter' */
                
                var defaultBackgroundColor = [ 'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(123, 82, 235, 0.4)', 'rgba(255, 120, 50, 0.2)', 'rgba(255, 00, 00, 0.6)', 'rgba(200, 00, 00, 0.6)', 'rgba(80, 00, 00, 0.6)', 'rgba(200, 50, 00, 0.3)' ];
                var defaultBorderColor = [ 'rgba(255,99,132,1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(103, 52, 235, 1)','rgba(255, 80, 30, 1)','rgba(255, 00, 00, .5)','rgba(155, 55, 55, .5)','rgba(80, 20, 00, .5)','rgba(220, 50, 20, 0.7)' ];
                var datasetList = [];
                var labelsList = [];
                
                if(groupingColumn) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', glLiquidServlet + '?operation=countOccurences&controlId=' + liquid.controlId + (typeof liquid.srcForeignWrk !== "undefined" && liquid.srcForeignWrk ? '&tblWrk=' + liquid.srcForeignWrk : '')
                            + (this.table ? '&targetDatabase=' + liquid.database : "")
                            + (this.table ? '&targetSchema=' + liquid.schema : "")
                            + (this.table ? '&targetTable=' + liquid.table : "")
                            + '&targetColumn=' + groupingColumn, false);
                    xhr.send();
                    if(xhr.status === 200) {
                        try {
                            if(xhr.responseText) {
                                var resultJson = JSON.parse(xhr.responseText);
                                if(typeof resultJson.resultSet !== 'undefined') {
                                    var nodeKeys = [];
                                    for(var i=0; i<resultJson.resultSet.length; i++) {
                                        var rs = resultJson.resultSet[i];
                                        if(rs) {
                                            var label = rs["1"];
                                            var value = rs["2"];
                                            nodeKeys.push( value );
                                            labelsList.push( label );
                                        }
                                    }
                                    datasetList.push( { data: nodeKeys, backgroundColor: defaultBackgroundColor, borderColor: defaultBorderColor } );                                    
                                } else {
                                    console.error("ERROR : Undetected result in SelectEditor()...");
                                }
                                if(resultJson.error) {
                                    console.error("[SERVER] ERROR:" + atob(resultJson.error));
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                } else {
                    if(nodes) {
                        for(var ic=0; ic<columns.length; ic++) {
                            var datasetLabel = (columns[ic].label ? columns[ic].label : columns[ic].name);
                            var backgroundColor = [];
                            var borderColor = [];
                            var nodeKeys = [];
                            for(var iN=0; iN<nodes.length; iN++) {
                                var data = nodes[iN].data[ columns[ic].field ];
                                try { nodeKeys.push( Number(data) ); } catch (e) { }
                                var dataLabel = (columns[ic].label ? columns[ic].label : columns[ic].name);
                                var labelDefined = false;
                                if(ic == 0) {
                                    if(chart.labelCol) {
                                        labelsList.push( nodes[iN].data[ chart.labelCol ] );
                                    } else {
                                        labelsList.push( iN === 0 ? dataLabel : "" );
                                    }
                                }
                                backgroundColor.push(ic < defaultBackgroundColor.length ? defaultBackgroundColor[ic] : '');
                                borderColor.push(ic < defaultBorderColor.length ? defaultBorderColor[ic] : '');
                            }
                            var dataChartType = types[ic] ? types[ic] : chartType;
                            datasetList.push( {  barPercentage: 0.5, barThickness: 6, maxBarThickness: 8, minBarLength: 2
                                                ,data: nodeKeys, type: dataChartType, label: datasetLabel
                                                ,backgroundColor:backgroundColor, borderColor:borderColor
                                                ,order:ic+1
                                            } );
                        }
                    }
                }
                
                
                    
                
                var chartTitle = chart.title?chart.title:"";

                var chartObj = document.getElementById("LiquidChartX.Chart");
                if(chartObj) {
                    var ctx = chartObj.getContext('2d');
                    if (!glChartObj) {
                        glChartObj = new Chart(ctx, {
                            type: chartType,
                            data: { datasets: datasetList, labels: labelsList },
                            options: {
                                responsive: true,
                                legend: {
                                    position: chart.legendPosition?chart.legendPosition:'top',
                                },
                                title: {
                                    display: true,
                                    text: chartTitle
                                },
                                animation: {
                                    animateScale: true,
                                    animateRotate: true
                                }
                            }
                        });
                    } else {
                        glChartObj.data.datasets = datasetList;
                        glChartObj.update();
                    }
                }
            }
            
            
        </script>        
    </head>
    <body onload="onLoad();">
        <div id="liquidChartX.container" class="liquidChartX" style=" ">
            <canvas id="LiquidChartX.Chart" style="width:100%; height:100%;"></canvas>
        </div>
    </body>
</html>