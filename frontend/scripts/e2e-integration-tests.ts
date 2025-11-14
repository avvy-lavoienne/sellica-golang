/**
 * E2E Integration Tests - Profile Management Workflow
 * 
 * Tests complete user workflows with running backend and frontend
 * Prerequisites: 
 * - Backend running on http://localhost:8080
 * - Frontend running on http://localhost:3000
 * - User authenticated (session token in localStorage)
 */

import fetch from 'node-fetch'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

const BACKEND_URL = 'http://localhost:8080'
const FRONTEND_URL = 'http://localhost:3000'

class E2ETestSuite {
  private results: TestResult[] = []
  private sessionToken: string = 'test-token-12345'

  /**
   * Test 1: Backend Health Check
   */
  async testBackendHealth(): Promise<void> {
    const start = Date.now()
    const testName = 'Backend Health Check'

    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      const data = await response.json() as any

      if (data.status === 'healthy' && data.services?.application?.status === 'healthy') {
        this.results.push({
          name: testName,
          passed: true,
          duration: Date.now() - start,
        })
        console.log(`✅ ${testName} (${Date.now() - start}ms)`)
      } else {
        throw new Error('Backend not fully healthy')
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Test 2: Get Profile Endpoint
   */
  async testGetProfile(): Promise<void> {
    const start = Date.now()
    const testName = 'GET /api/v1/profile'

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json() as any
        if (data.data?.name && data.data?.nip) {
          this.results.push({
            name: testName,
            passed: true,
            duration: Date.now() - start,
          })
          console.log(
            `✅ ${testName} (${Date.now() - start}ms) - Profile: ${data.data.name}`,
          )
        } else {
          throw new Error('Invalid profile data returned')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Test 3: Update Profile Endpoint
   */
  async testUpdateProfile(): Promise<void> {
    const start = Date.now()
    const testName = 'PATCH /api/v1/profile'

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User Updated',
          position: 'Senior Staff',
        }),
      })

      if (response.ok) {
        const data = await response.json() as any
        if (
          data.data?.name === 'Test User Updated' &&
          data.data?.position === 'Senior Staff'
        ) {
          this.results.push({
            name: testName,
            passed: true,
            duration: Date.now() - start,
          })
          console.log(`✅ ${testName} (${Date.now() - start}ms)`)
        } else {
          throw new Error('Profile not updated correctly')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Test 4: Get Avatar URL Endpoint
   */
  async testGetAvatarUrl(): Promise<void> {
    const start = Date.now()
    const testName = 'GET /api/v1/profile/avatar-url'

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/profile/avatar-url`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.ok) {
        this.results.push({
          name: testName,
          passed: true,
          duration: Date.now() - start,
        })
        console.log(`✅ ${testName} (${Date.now() - start}ms)`)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Test 5: Frontend Health Check
   */
  async testFrontendHealth(): Promise<void> {
    const start = Date.now()
    const testName = 'Frontend Health Check'

    try {
      const response = await fetch(FRONTEND_URL)
      if (response.ok) {
        const html = await response.text()
        if (html.includes('html') || html.includes('next')) {
          this.results.push({
            name: testName,
            passed: true,
            duration: Date.now() - start,
          })
          console.log(`✅ ${testName} (${Date.now() - start}ms)`)
        } else {
          throw new Error('Frontend not serving HTML')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Test 6: API Response Times
   */
  async testResponseTimes(): Promise<void> {
    const start = Date.now()
    const testName = 'API Response Time Benchmarks'

    try {
      const times: Record<string, number> = {}

      // Profile GET
      let apiStart = Date.now()
      await fetch(`${BACKEND_URL}/api/v1/profile`, {
        headers: { 'Authorization': `Bearer ${this.sessionToken}` },
      })
      times['GET /profile'] = Date.now() - apiStart

      // Profile PATCH
      apiStart = Date.now()
      await fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: 'Staff' }),
      })
      times['PATCH /profile'] = Date.now() - apiStart

      // Avatar URL GET
      apiStart = Date.now()
      await fetch(`${BACKEND_URL}/api/v1/profile/avatar-url`, {
        headers: { 'Authorization': `Bearer ${this.sessionToken}` },
      })
      times['GET /avatar-url'] = Date.now() - apiStart

      const avgTime =
        Object.values(times).reduce((a, b) => a + b, 0) /
        Object.keys(times).length

      const allWithinTarget = Object.entries(times).every(([endpoint, time]) => {
        const isGetProfile = endpoint.includes('/profile')
        const target = isGetProfile ? 500 : 1000
        return time <= target
      })

      if (allWithinTarget) {
        this.results.push({
          name: testName,
          passed: true,
          duration: Date.now() - start,
        })
        console.log(`✅ ${testName}:`)
        Object.entries(times).forEach(([endpoint, time]) => {
          console.log(`   ${endpoint}: ${time}ms`)
        })
        console.log(`   Average: ${Math.round(avgTime)}ms`)
      } else {
        throw new Error(
          `Response times exceeded targets: ${JSON.stringify(times)}`,
        )
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Test 7: Error Handling - Unauthorized
   */
  async testErrorHandling(): Promise<void> {
    const start = Date.now()
    const testName = 'Error Handling - Unauthorized Request'

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401 || response.status === 403) {
        this.results.push({
          name: testName,
          passed: true,
          duration: Date.now() - start,
        })
        console.log(
          `✅ ${testName} - Correctly rejected with HTTP ${response.status}`,
        )
      } else {
        throw new Error(`Expected 401/403, got ${response.status}`)
      }
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('🚀 E2E Integration Tests - Profile Management')
    console.log('='.repeat(60) + '\n')

    console.log('Backend URL:', BACKEND_URL)
    console.log('Frontend URL:', FRONTEND_URL)
    console.log('')

    // Run tests sequentially
    await this.testBackendHealth()
    await this.testFrontendHealth()
    await this.testGetProfile()
    await this.testUpdateProfile()
    await this.testGetAvatarUrl()
    await this.testResponseTimes()
    await this.testErrorHandling()

    // Print summary
    this.printSummary()
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary')
    console.log('='.repeat(60))

    const passed = this.results.filter((r) => r.passed).length
    const failed = this.results.filter((r) => !r.passed).length
    const total = this.results.length
    const totalDuration = this.results.reduce((a, b) => a + b.duration, 0)

    console.log(`\nTotal Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Duration: ${totalDuration}ms`)
    console.log(`⏱️  Average per test: ${Math.round(totalDuration / total)}ms`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}: ${r.error}`)
        })
    }

    console.log('\n' + '='.repeat(60))
    console.log(failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
    console.log('='.repeat(60) + '\n')
  }
}

// Run tests
const suite = new E2ETestSuite()
suite.runAll().catch(console.error)
