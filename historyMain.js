$(document).ready(function () {
    // Attach click event to fetch logs button
    $('#fetchLogsButton').click(function () {
        const date = $('#historyDate').val(); // Get selected date
        const numRecords = $('#numRecords').val(); // Get number of records

        // Validate user input
        if (!date || numRecords <= 0) {
            alert('Please provide a valid date and number of records.');
            return;
        }

        // Call fetchHistoryLogs and handle the response
        fetchHistoryLogs(date, numRecords)
            .done(function (response) {
                if (response.status === 0) {
                    populateHistoryLogsTable(response.result); // Populate table with logs
                    calculateHistoryDailyTotals(response.result); // Calculate totals for the day
                } else {
                    alert(`Error: ${response.message}`);
                }
            })
            .fail(function () {
                alert("An error occurred. Please try again.");
            });
    });
});

// Populate the logs table with data
function populateHistoryLogsTable(logs) {
    const tableBody = $('#logsTableBody');
    tableBody.empty(); // Clear existing rows

    if (logs.length === 0) {
        tableBody.html('<tr><td colspan="3" class="text-center">No logs found for the selected date.</td></tr>');
        return;
    }

    logs.forEach((log) => {
        try {
            const output = JSON.parse(log.OutputData || "{}");
            const escapedOutput = JSON.stringify(output)
                .replace(/'/g, "&#39;")
                .replace(/"/g, "&quot;");

            const inputTokens = output?.usage?.prompt_tokens || 0;
            const outputTokens = output?.usage?.completion_tokens || 0;
            const cost = calculateHistoryCost(inputTokens, outputTokens);

            const userPrompt = JSON.parse(log.InputData)?.userPrompt || "N/A";
            const systemPrompt = JSON.parse(log.InputData)?.systemPrompt || "N/A";
            const truncatedPrompt = userPrompt.length > 50 ? `${userPrompt.substring(0, 50)}...` : userPrompt;

            const utcTimestamp = new Date(log.Timestamp);
            if (isNaN(utcTimestamp)) throw new Error("Invalid Timestamp");

            const estTimestamp = new Date(utcTimestamp.getTime() - 5 * 60 * 60 * 1000).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "medium",
            });

            tableBody.append(`
                <tr class="selectable-row" data-output="${escapedOutput}" data-user-prompt="${userPrompt}" data-system-prompt="${systemPrompt}">
                    <td>${cost}</td>
                    <td>${estTimestamp}</td>
                    <td title="${userPrompt}">${truncatedPrompt}</td>
                </tr>
            `);
        } catch (error) {
            console.error("Error processing log:", error.message, log);
        }
    });

    $('.selectable-row').click(function () {
        const outputData = JSON.parse($(this).attr('data-output').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
        const userPrompt = $(this).data('user-prompt');
        const systemPrompt = $(this).data('system-prompt');
        showHistoryOutputModal(outputData, userPrompt, systemPrompt);
    });
}

// Show modal with detailed log data
function showHistoryOutputModal(outputData, userPrompt, systemPrompt) {
    const choices = outputData?.choices || [];
    const usage = outputData?.usage || {};

    const timestamp = new Date(outputData?.created * 1000 || Date.now()).toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "medium",
        timeStyle: "medium",
    });

    const rawResponse = choices[0]?.message?.content || "No AI response available.";
    const formattedResponse = formatChatGPTResponse(rawResponse);

    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const cost = calculateHistoryCost(inputTokens, outputTokens);

    $("#outputModal .modal-body").html(`
        <table class="table table-striped">
            <tr><th>Date/Time (EST)</th><td>${timestamp}</td></tr>
            <tr><th>User Input</th><td>${userPrompt}</td></tr>
            <tr><th>Computer Generated Prompt</th><td>${systemPrompt}</td></tr>
            <tr><th>AI Response</th><td>${formattedResponse}</td></tr>
            <tr><th>Tokens</th><td>${usage?.total_tokens}</td></tr>
            <tr><th>Cost (Cents)</th><td>${cost}</td></tr>
        </table>
    `);
    $("#outputModal").modal("show");
}

// Calculate the cost based on input and output tokens
function calculateHistoryCost(inputTokens, outputTokens) {
    return ((inputTokens * 0.000015) + (outputTokens * 0.00006)).toFixed(4); // Return cost in cents
}

// Calculate totals for the day
function calculateHistoryDailyTotals(logs) {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    logs.forEach((log) => {
        try {
            const output = JSON.parse(log.OutputData || "{}");
            const usage = output?.usage || {};

            totalInputTokens += usage?.prompt_tokens || 0;
            totalOutputTokens += usage?.completion_tokens || 0;
            totalCost += parseFloat(calculateHistoryCost(usage?.prompt_tokens || 0, usage?.completion_tokens || 0));
        } catch (error) {
            console.error("Error calculating totals:", error.message, log);
        }
    });

    $('#dailyTotals').html(`
        <table class="table table-bordered">
            <tr><th>Total Input Tokens</th><td>${totalInputTokens}</td></tr>
            <tr><th>Total Output Tokens</th><td>${totalOutputTokens}</td></tr>
            <tr><th>Total Cost (Cents)</th><td>${totalCost.toFixed(4)}</td></tr>
        </table>
    `);
}

// Format AI response content with Markdown support
function formatChatGPTResponse(content) {
    return `<div class="markdown-output">${content
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/```([\s\S]*?)```/g, '<div class="code-block rounded p-3 bg-light-grey border"><pre><code>$1</code></pre></div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/^- (.*?)$/gm, '<ul><li>$1</li></ul>')
        .replace(/^\d+\. (.*?)$/gm, '<ol><li>$1</li></ol>')}</div>`;
}
