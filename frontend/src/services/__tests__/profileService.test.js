/**
 * Tests pour le profileService
 * Vérifie que les initiales et photos sont générées/récupérées correctement
 */

import { profileService } from '../profileService';

describe('profileService', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    localStorageMock.clear();
  });

  describe('getInitials', () => {
    it('devrait générer les initiales pour un employeur avec denomination', () => {
      const user = { denomination: 'Acme Corporation' };
      const initials = profileService.getInitials(user, 'employer');
      expect(initials).toBe('AC');
    });

    it('devrait générer les initiales pour un employeur avec un seul mot', () => {
      const user = { denomination: 'Acme' };
      const initials = profileService.getInitials(user, 'employer');
      expect(initials).toBe('A');
    });

    it('devrait générer les initiales pour un freelancer', () => {
      const user = { prenom: 'Jean', nom: 'Dupont' };
      const initials = profileService.getInitials(user, 'freelancer');
      expect(initials).toBe('JD');
    });

    it('devrait retourner EN si pas de denomination pour employer', () => {
      const user = {};
      const initials = profileService.getInitials(user, 'employer');
      expect(initials).toBe('EN');
    });

    it('devrait retourner IN si pas de prenom/nom pour freelancer', () => {
      const user = {};
      const initials = profileService.getInitials(user, 'freelancer');
      expect(initials).toBe('IN');
    });

    it('devrait gérer les espaces dans la denomination', () => {
      const user = { denomination: '  Tech  Solutions  ' };
      const initials = profileService.getInitials(user, 'employer');
      expect(initials).toBe('TS');
    });
  });

  describe('getProfileImage', () => {
    it('devrait retourner la photo du backend si disponible', () => {
      const user = { 
        id: 1,
        photo_profil: 'https://example.com/photo.jpg'
      };
      const image = profileService.getProfileImage(user);
      expect(image).toBe('https://example.com/photo.jpg');
    });

    it('devrait retourner la photo du localStorage si pas de backend', () => {
      const user = { id: 1 };
      const testImage = 'data:image/jpeg;base64,test';
      localStorage.setItem('profileImage_1', testImage);
      
      const image = profileService.getProfileImage(user);
      expect(image).toBe(testImage);
    });

    it('devrait retourner null si pas de photo', () => {
      const user = { id: 1 };
      const image = profileService.getProfileImage(user);
      expect(image).toBeNull();
    });

    it('devrait prioriser le backend sur localStorage', () => {
      const user = { 
        id: 1,
        photo_profil: 'https://example.com/photo.jpg'
      };
      const testImage = 'data:image/jpeg;base64,test';
      localStorage.setItem('profileImage_1', testImage);
      
      const image = profileService.getProfileImage(user);
      expect(image).toBe('https://example.com/photo.jpg');
    });
  });

  describe('getCoverImage', () => {
    it('devrait retourner l\'image de couverture du backend si disponible', () => {
      const user = { 
        id: 1,
        image_couverture: 'https://example.com/cover.jpg'
      };
      const image = profileService.getCoverImage(user);
      expect(image).toBe('https://example.com/cover.jpg');
    });

    it('devrait retourner l\'image de couverture du localStorage si pas de backend', () => {
      const user = { id: 1 };
      const testImage = 'data:image/jpeg;base64,cover';
      localStorage.setItem('coverImage_1', testImage);
      
      const image = profileService.getCoverImage(user);
      expect(image).toBe(testImage);
    });
  });

  describe('saveProfileImage', () => {
    it('devrait sauvegarder dans localStorage et retourner les données', () => {
      const imageData = 'data:image/jpeg;base64,test';
      const result = profileService.saveProfileImage(imageData, 1);
      
      expect(result).toEqual({ photo_profil: imageData });
      expect(localStorage.getItem('profileImage_1')).toBe(imageData);
    });

    it('devrait retourner les données même sans userId', () => {
      const imageData = 'data:image/jpeg;base64,test';
      const result = profileService.saveProfileImage(imageData, null);
      
      expect(result).toEqual({ photo_profil: imageData });
    });
  });

  describe('saveCoverImage', () => {
    it('devrait sauvegarder dans localStorage et retourner les données', () => {
      const imageData = 'data:image/jpeg;base64,cover';
      const result = profileService.saveCoverImage(imageData, 1);
      
      expect(result).toEqual({ image_couverture: imageData });
      expect(localStorage.getItem('coverImage_1')).toBe(imageData);
    });
  });

  describe('clearProfileCache', () => {
    it('devrait nettoyer le cache localStorage', () => {
      const userId = 1;
      localStorage.setItem(`profileImage_${userId}`, 'test1');
      localStorage.setItem(`coverImage_${userId}`, 'test2');
      
      profileService.clearProfileCache(userId);
      
      expect(localStorage.getItem(`profileImage_${userId}`)).toBeNull();
      expect(localStorage.getItem(`coverImage_${userId}`)).toBeNull();
    });
  });

  describe('getDisplayName', () => {
    it('devrait retourner la denomination pour un employeur', () => {
      const user = { denomination: 'Acme Corporation' };
      const name = profileService.getDisplayName(user, 'employer');
      expect(name).toBe('Acme Corporation');
    });

    it('devrait retourner prenom + nom pour un freelancer', () => {
      const user = { prenom: 'Jean', nom: 'Dupont' };
      const name = profileService.getDisplayName(user, 'freelancer');
      expect(name).toBe('Jean Dupont');
    });

    it('devrait retourner Mon Recruteur si pas de denomination', () => {
      const user = {};
      const name = profileService.getDisplayName(user, 'employer');
      expect(name).toBe('Mon Recruteur');
    });

    it('devrait retourner Utilisateur si pas de prenom/nom', () => {
      const user = {};
      const name = profileService.getDisplayName(user, 'freelancer');
      expect(name).toBe('Utilisateur');
    });
  });
});
