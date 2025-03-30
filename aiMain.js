$(document).ready(function () {
    // Populate the knowledge levels dropdown
    loadKnowledgeLevels();

    // Attach click event to the submit button
    $("#submitButton").on("click", function () {
        handleChatRequest();
    });
});

// Load knowledge levels into the dropdown
function loadKnowledgeLevels() {
    fetchKnowledgeLevels()
        .done(function (data) {
            $("#knowledgeDropdown").html(""); // Clear existing options

            data.result.forEach(function (level) {
                $("#knowledgeDropdown").append(
                    `<option value="${level.levelid}" data-prompt="${level.prompt}">${level.description}</option>`
                );
            });
        })
        .fail(function (error) {
            console.error("Error fetching levels:", error.statusText);
            alert("Failed to load knowledge levels. Please try again.");
        });
}

// Handle the chat request
function handleChatRequest() {
    const inputText = $("#textInput").val().trim(); // Get user input
    const level = $("#knowledgeDropdown option:selected").data("prompt"); // Get selected system prompt

    // Validate input
    if (!inputText) {
        alert("Please enter a question.");
        return;
    }
    if (!level || level === "Loading...") {
        alert("Please select a knowledge level.");
        return;
    }

    // Send the chat request
    sendChatRequest(inputText, level)
        .done(function (response) {
            console.log("Response received:", response);

            // Save the log to the database, including user input
            saveLogToDatabase(
                { userPrompt: inputText, systemPrompt: level }, // InputData
                response // OutputData
            )
                .fail(function () {
                    console.error("Failed to save log entry.");
                });

            // Display the response
            const formattedContent = formatChatGPTResponse(response.choices[0].message.content);
            $("#output").html(formattedContent);
        })
        .fail(function (xhr, status, error) {
            console.error("Error processing chat request:", status, error);
            $("#output").html(`<p class="text-danger">An error occurred while processing your request.</p>`);
        });
}


// Format AI response content with Markdown support
function formatChatGPTResponse(jsonResponse) {
    if (!jsonResponse || typeof jsonResponse !== "string") {
        return "<p class='text-danger'>Invalid response format. Unable to display content.</p>";
    }

    return `<div class="markdown-output">${jsonResponse
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
