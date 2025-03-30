// AJAX call to fetch logs
function fetchHistoryLogs(date, numRecords) {
    return $.ajax({
        url: '/final.php/getLog/',
        method: 'GET',
        data: { date, numRecords },
        dataType: 'json',
    });
}
