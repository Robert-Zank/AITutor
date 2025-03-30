// AJAX call to fetch knowledge levels
function fetchKnowledgeLevels() {
    return $.ajax({
        url: '/final.php/getLevel',
        method: "GET",
    });
}

// AJAX call to send a chat request
function sendChatRequest(userPrompt, systemPrompt) {
    const url = "/openai_proxy.php"; // Proxy endpoint

    return $.ajax({
        url: url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        }),
    });
}


// AJAX call to save logs to the database
function saveLogToDatabase(inputData, outputData) {
    const inputtokens = JSON.stringify(inputData);
    const outputtokens = JSON.stringify(outputData);

    const url = `/final.php/addLog?inputtokens=${encodeURIComponent(inputtokens)}&outputtokens=${encodeURIComponent(outputtokens)}`;

    return $.ajax({
        url: url,
        method: "GET",
    });
}
