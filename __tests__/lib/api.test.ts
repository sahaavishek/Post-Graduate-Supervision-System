/**
 * API Utility Tests
 * Tests for the API utility functions in lib/api.ts
 */

import { getUploadUrl, setToken, removeToken } from '@/lib/api';

describe('API Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock sessionStorage
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (window.sessionStorage.setItem as jest.Mock).mockImplementation(() => {});
    (window.sessionStorage.removeItem as jest.Mock).mockImplementation(() => {});
  });

  describe('getUploadUrl', () => {
    it('should return placeholder for null/undefined path', () => {
      expect(getUploadUrl(null)).toBe('/placeholder.svg');
      expect(getUploadUrl(undefined)).toBe('/placeholder.svg');
    });

    it('should return full URL as-is if it starts with http', () => {
      const url = 'https://example.com/image.jpg';
      expect(getUploadUrl(url)).toBe(url);
    });

    it('should return data URL as-is if it starts with data:', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANS';
      expect(getUploadUrl(dataUrl)).toBe(dataUrl);
    });

    it('should prefix with backend URL for /uploads paths', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000/api';
      
      const path = '/uploads/avatars/test.jpg';
      const result = getUploadUrl(path);
      expect(result).toBe('http://localhost:5000/uploads/avatars/test.jpg');
      
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('should return path as-is for other paths', () => {
      const path = '/custom/path/image.jpg';
      expect(getUploadUrl(path)).toBe(path);
    });
  });

  describe('Token Management', () => {
    it('should set token in sessionStorage', () => {
      setToken('test-token-123');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('token', 'test-token-123');
    });

    it('should remove token from sessionStorage', () => {
      removeToken();
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});

