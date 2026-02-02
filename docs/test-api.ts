#!/usr/bin/env bun

/**
 * Interactive API Testing Script
 * 
 * Tests the current API structure (oRPC + HTTP file operations)
 * Run with: bun test-api.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testAPI() {
  console.log("🧪 Testing APIs...\n");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  console.log("1️⃣  Testing Health Check...");
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Response:`, JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n" + "─".repeat(60) + "\n");

  // Test 2: oRPC - List Documents
  console.log("2️⃣  Testing oRPC: List Documents...");
  try {
    const response = await fetch(`${BASE_URL}/rpc/document/listDocuments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          page: 1,
          limit: 10,
        },
      }),
    });

    const text = await response.text();
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
      } catch {
        console.log(`   📄 Response (text): ${text.substring(0, 200)}`);
      }
    } else {
      console.log(`   ⚠️  Error Response: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n" + "─".repeat(60) + "\n");

  // Test 3: oRPC - Get Document (will fail if no documents exist, that's ok)
  console.log("3️⃣  Testing oRPC: Get Document (example with fake ID)...");
  try {
    const response = await fetch(`${BASE_URL}/rpc/document/getDocument`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          documentId: "00000000-0000-0000-0000-000000000000",
        },
      }),
    });

    const text = await response.text();
    console.log(`   📊 Status: ${response.status}`);
    
    try {
      const data = JSON.parse(text);
      if (response.ok) {
        console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`   ⚠️  Expected error (document not found):`, JSON.stringify(data, null, 2));
      }
    } catch {
      console.log(`   📄 Response: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n" + "─".repeat(60) + "\n");

  // Test 4: oRPC - List Documents with tags filter (search)
  console.log("4️⃣  Testing oRPC: Search Documents by Tags...");
  try {
    const response = await fetch(`${BASE_URL}/rpc/document/listDocuments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          page: 1,
          limit: 10,
          tags: ["test"],
        },
      }),
    });

    const text = await response.text();
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
      } catch {
        console.log(`   📄 Response (text): ${text.substring(0, 200)}`);
      }
    } else {
      console.log(`   ⚠️  Error Response: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n" + "─".repeat(60) + "\n");

  // Test 5: File Upload (if you have a test file)
  console.log("5️⃣  Testing HTTP: File Upload...");
  console.log("   💡 To test file upload, use:");
  console.log(`   curl -X POST ${BASE_URL}/documents/upload \\`);
  console.log(`     -F "file=@/path/to/file.pdf" \\`);
  console.log(`     -F 'metadataTags=["test","api"]'`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ API Testing Complete!");
  console.log("=".repeat(60));
  console.log("\n📚 For more examples, see: docs/API_USAGE_GUIDE.md");
}

// Run tests
testAPI().catch(console.error);
