<?php
// openai_proxy.php

// Set your OpenAI API key
$apiKey = "";

// Start session for rate limiting
session_start();
$time = microtime(true);
if (isset($_SESSION['last_request_time']) && $time - $_SESSION['last_request_time'] < 1) {
    http_response_code(429);
    echo json_encode(["error" => "Too many requests. Please wait a second before trying again."]);
    exit;
}
$_SESSION['last_request_time'] = $time;

// Ensure logs directory exists
$logDir = "logs";
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = "$logDir/request.log";

// Get the POST data from the frontend
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Validate the input
if (!isset($data["messages"])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid request. Missing 'messages' parameter."]);
    exit;
}

// Prepare the request payload for OpenAI API
$payload = json_encode([
    "model" => "gpt-3.5-turbo",
    "messages" => $data["messages"]
]);

// Set up the cURL request to OpenAI API
$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
]);

// Execute the request
$response = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Retry logic for 429 errors (rate limiting)
if ($httpStatus == 429) {
    sleep(1); // Wait for 1 second
    $response = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
}

// Close the cURL session
curl_close($ch);

// Log the exact OpenAI response for debugging
file_put_contents(
    $logFile,
    "[" . date("Y-m-d H:i:s") . "] OpenAI Response: " . $response . "\n\n",
    FILE_APPEND
);


// Set headers and send the response to the frontend
header("Content-Type: application/json");
http_response_code($httpStatus);
echo $response;

?>
