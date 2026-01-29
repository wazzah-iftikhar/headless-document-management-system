#!/usr/bin/env bun

/**
 * Automated Endpoint Testing Script
 * 
 * Tests all API endpoints in sequence
 * Run with: bun test-endpoints.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`\n${message}`);
}

function logResult(result: TestResult) {
  const icon = result.passed ? "✅" : "❌";
  console.log(`${icon} ${result.name}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  if (result.data && !result.passed) {
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
  }
  results.push(result);
}

async function test(name: string, fn: () => Promise<any>): Promise<any> {
  try {
    const data = await fn();
    logResult({ name, passed: true, data });
    return data;
  } catch (error: any) {
    logResult({ 
      name, 
      passed: false, 
      error: error.message,
      data: error.response?.data || error.message 
    });
    throw error;
  }
}

async function main() {
  log("🚀 Starting Endpoint Tests");
  log(`📍 Base URL: ${BASE_URL}`);

  let documentId: string | null = null;
  let downloadToken: string | null = null;

  // Test 1: Health Check
  await test("Health Check", async () => {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 2: Upload Document
  const uploadResult = await test("Upload Document", async () => {
    // Create a dummy PDF file for testing
    const pdfContent = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 0\ntrailer\n<< /Size 0 /Root 1 0 R >>\nstartxref\n9\n%%EOF");
    
    const formData = new FormData();
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const file = new File([blob], "test.pdf", { type: "application/pdf" });
    formData.append("file", file);
    formData.append("metadataTags", JSON.stringify(["test", "automated"]));

    const response = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Status: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    if (data.success && data.data?.id) {
      documentId = data.data.id;
      log(`   📄 Document ID: ${documentId}`);
    }
    return data;
  });

  if (!documentId) {
    log("❌ Cannot continue tests without document ID");
    return;
  }

  // Test 3: Get All Documents
  await test("Get All Documents", async () => {
    const response = await fetch(`${BASE_URL}/documents`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 4: Get Document by ID
  await test("Get Document by ID", async () => {
    const response = await fetch(`${BASE_URL}/documents/${documentId}`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 5: Update Document
  await test("Update Document", async () => {
    const response = await fetch(`${BASE_URL}/documents/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadataTags: ["updated", "test", "automated"] }),
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 6: Search Documents (GET)
  await test("Search Documents (GET)", async () => {
    const response = await fetch(`${BASE_URL}/documents/search?tags=test&tags=automated`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 7: Search Documents (POST)
  await test("Search Documents (POST)", async () => {
    const response = await fetch(`${BASE_URL}/documents/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: ["test", "automated"] }),
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 8: Generate Download Link
  const downloadLinkResult = await test("Generate Download Link", async () => {
    const response = await fetch(`${BASE_URL}/documents/${documentId}/download-link`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data?.token) {
      downloadToken = data.data.token;
      log(`   🔑 Download Token: ${downloadToken.substring(0, 20)}...`);
    }
    return data;
  });

  // Test 9: Download Document by Token
  if (downloadToken) {
    await test("Download Document by Token", async () => {
      const response = await fetch(`${BASE_URL}/documents/download/${downloadToken}`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/pdf")) {
        throw new Error(`Expected PDF, got: ${contentType}`);
      }
      return { success: true, contentType, size: (await response.blob()).size };
    });
  }

  // Test 10: Delete Document
  await test("Delete Document", async () => {
    const response = await fetch(`${BASE_URL}/documents/${documentId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  });

  // Test 11: Verify Document Deleted
  await test("Verify Document Deleted (404)", async () => {
    const response = await fetch(`${BASE_URL}/documents/${documentId}`);
    if (response.status === 404) {
      return { success: true, message: "Document correctly deleted" };
    }
    throw new Error(`Expected 404, got ${response.status}`);
  });

  // Summary
  log("\n" + "=".repeat(50));
  log("📊 Test Summary");
  log("=".repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);
  
  if (failed === 0) {
    log("\n🎉 All tests passed!");
  } else {
    log("\n⚠️  Some tests failed. Check the output above for details.");
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
