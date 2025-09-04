import { CrimeAgentService } from '../../services/CrimeAgentService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CrimeAgentService', () => {
  let crimeAgentService: CrimeAgentService;

  beforeEach(() => {
    crimeAgentService = new CrimeAgentService();
    crimeAgentService.clearCache();
    jest.clearAllMocks();
  });

  describe('getCrimeGrade', () => {
    it('should return a valid crime grade for any address', async () => {
      const address = '123 Main Street, Anytown, CA 12345';
      const grade = await crimeAgentService.getCrimeGrade(address);

      expect(grade).toMatch(/^[A-F]$/);
    });

    it('should return consistent grades for the same address', async () => {
      const address = '456 Oak Avenue, Springfield, IL 62701';
      
      const grade1 = await crimeAgentService.getCrimeGrade(address);
      const grade2 = await crimeAgentService.getCrimeGrade(address);

      expect(grade1).toBe(grade2);
    });

    it('should normalize addresses and return same grade for equivalent addresses', async () => {
      const address1 = '789 Pine St, Denver, CO 80202';
      const address2 = '  789   PINE   ST,   DENVER,   CO   80202  ';
      const address3 = '789 Pine St., Denver, CO 80202';

      const grade1 = await crimeAgentService.getCrimeGrade(address1);
      const grade2 = await crimeAgentService.getCrimeGrade(address2);
      const grade3 = await crimeAgentService.getCrimeGrade(address3);

      expect(grade1).toBe(grade2);
      expect(grade1).toBe(grade3);
    });

    it('should use cache for repeated requests', async () => {
      const address = '321 Elm Street, Boston, MA 02101';
      
      // First call
      const grade1 = await crimeAgentService.getCrimeGrade(address);
      expect(crimeAgentService.getCacheSize()).toBe(1);
      
      // Second call should use cache
      const grade2 = await crimeAgentService.getCrimeGrade(address);
      expect(grade1).toBe(grade2);
      expect(crimeAgentService.getCacheSize()).toBe(1);
    });

    it('should handle API success response', async () => {
      const address = '555 Broadway, New York, NY 10012';
      const mockResponse = {
        data: { grade: 'B' }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const grade = await crimeAgentService.getCrimeGrade(address);
      expect(grade).toBe('B');
    });

    it('should handle API failure gracefully', async () => {
      const address = '777 Market Street, San Francisco, CA 94102';
      
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const grade = await crimeAgentService.getCrimeGrade(address);
      expect(grade).toMatch(/^[A-F]$/);
    });

    it('should validate and correct invalid grades from API', async () => {
      const address = '888 State Street, Chicago, IL 60601';
      const mockResponse = {
        data: { grade: 'X' } // Invalid grade
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const grade = await crimeAgentService.getCrimeGrade(address);
      expect(grade).toBe('C'); // Should return default grade
    });

    it('should return specific grades for certain address patterns', async () => {
      const testCases = [
        { address: '123 Downtown Street', expectedPattern: /[D-F]/ },
        { address: '456 Beverly Hills Drive', expectedPattern: /[A-C]/ },
        { address: '789 Industrial Boulevard', expectedPattern: /F/ },
        { address: '321 Park Avenue', expectedPattern: /[A-C]/ }
      ];

      for (const testCase of testCases) {
        const grade = await crimeAgentService.getCrimeGrade(testCase.address);
        expect(grade).toMatch(testCase.expectedPattern);
      }
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', async () => {
      const address = '999 Test Street';
      
      await crimeAgentService.getCrimeGrade(address);
      expect(crimeAgentService.getCacheSize()).toBe(1);
      
      crimeAgentService.clearCache();
      expect(crimeAgentService.getCacheSize()).toBe(0);
    });

    it('should handle multiple addresses in cache', async () => {
      const addresses = [
        '111 First Street',
        '222 Second Avenue',
        '333 Third Boulevard'
      ];

      for (const address of addresses) {
        await crimeAgentService.getCrimeGrade(address);
      }

      expect(crimeAgentService.getCacheSize()).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const address = '404 Timeout Lane';
      
      mockedAxios.get.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      const grade = await crimeAgentService.getCrimeGrade(address);
      expect(grade).toMatch(/^[A-F]$/);
    });

    it('should handle malformed API responses', async () => {
      const address = '500 Error Street';
      const mockResponse = {
        data: null
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const grade = await crimeAgentService.getCrimeGrade(address);
      expect(grade).toMatch(/^[A-F]$/);
    });
  });
});