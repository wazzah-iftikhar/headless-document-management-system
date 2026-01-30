#!/usr/bin/env bun

/**
 * Test oRPC Endpoints
 * 
 * Simple test script to verify oRPC is working
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testOrpc() {
  console.log("🧪 Testing oRPC endpoints...\n");

  // Test 1: List Documents
  console.log("1. Testing listDocuments procedure...");
  try {
    const response = await fetch(`${BASE_URL}/rpc/document.listDocuments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          page: 1,
          limit: 10,
        },
      }),
    });

    const data = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${data.substring(0, 200)}...`);
    
    if (response.ok) {
      console.log("   ✅ listDocuments works!\n");
    } else {
      console.log("   ❌ listDocuments failed\n");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: Health check (should still work)
  console.log("2. Testing health endpoint...");
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log(`   ✅ Health check works: ${JSON.stringify(data)}\n`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
}

// Run tests
testOrpc().catch(console.error);
