const { authenticate, getAlerts, getScore, chat } = require("./dist/index");

async function main() {
    console.log("=== G-TEN TypeScript SDK Integration Test ===");

    // Step 1: Verify that calling a protected API before auth throws the correct error
    console.log("\n1. Testing unauthenticated guard...");
    try {
        await getAlerts();
        console.error("FAIL: Expected an authentication error but call succeeded.");
    } catch (err) {
        console.log(`PASS: Received expected error: "${err.message}"`);
        if (err.name !== "GTenAuthError") {
            console.error(`FAIL: Expected error name to be GTenAuthError, got ${err.name}`);
        }
    }

    // Step 2: Authenticate
    console.log("\n2. Testing authentication...");
    try {
        const authResult = await authenticate({
            username: "admin",
            password: "password",
            baseUrl: "http://localhost:8000"
        });
        console.log("PASS: Authenticated successfully:", authResult);
    } catch (err) {
        console.error("FAIL: Failed to authenticate:", err);
        return;
    }

    // Step 3: Fetch Alerts
    console.log("\n3. Testing getAlerts()...");
    try {
        const alerts = await getAlerts(2);
        console.log(`PASS: Successfully fetched alerts. Found: ${alerts.alerts.length}`);
        console.log("Sample Alert:", JSON.stringify(alerts.alerts[0], null, 2));
    } catch (err) {
        console.error("FAIL: Failed to fetch alerts:", err);
    }

    // Step 4: Get Risk Score
    console.log("\n4. Testing getScore()...");
    try {
        // Let's use a dummy or standard account ID if we have one. If it throws 404, we catch it.
        const score = await getScore("ACC001");
        console.log("PASS: Risk score response:", score);
    } catch (err) {
        console.log("INFO: getScore ACC001 returned (expected if ACC001 not present):", err.message);
    }

    // Step 5: Test AI Copilot Chat
    console.log("\n5. Testing copilot chat()...");
    try {
        const chatResponse = await chat("Hello! Who are you?");
        console.log("PASS: Copilot response:", chatResponse.response);
    } catch (err) {
        console.error("FAIL: Failed to chat with copilot:", err);
    }

    console.log("\n=== Test Run Completed ===");
}

main().catch(console.error);
