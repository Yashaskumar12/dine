import * as React from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { User, UserAddress, LocationSettings } from '@/types/user';
import { Camera, Loader2, User as LucideUser } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Type guard to check if user has Firebase Auth methods
const hasFirebaseAuth = (user: User | null): user is User & FirebaseUser => {
  return !!user && typeof (user as any).getIdToken === 'function';
};

interface FormDataState {
  displayName: string;
  name: string;
  phoneNumber: string;
  photoURL: string | null;
  address: UserAddress;
  locationSettings: LocationSettings;
  errors: Record<string, string>;
}

type PageType = 'dashboard' | 'settings' | 'checkout' | 'profile';

interface ProfileSettingsProps {
  user: User | null;
  onUpdate?: (updates: Partial<User>) => Promise<void>;
  isDarkMode?: boolean;
  pageType?: PageType;
}

type AuthenticatedUser = User & { getIdToken: () => Promise<string> };

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user: propUser,
  onUpdate,
  isDarkMode = false,
  pageType = 'settings',
}) => {
  // Define styles based on page type
  const pageStyles = useMemo(() => {
    const baseStyles = {
      container: {
        padding: '1.5rem',
        borderRadius: '0.5rem',
        margin: '0 auto',
        maxWidth: '100%',
      },
      title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
      },
      form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem',
      },
    };

    switch (pageType) {
      case 'dashboard':
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            padding: '1rem',
            backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          },
          title: {
            ...baseStyles.title,
            fontSize: '1.25rem',
            marginBottom: '1rem',
          },
        };
      case 'checkout':
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            padding: '1.25rem',
            backgroundColor: isDarkMode ? '#111827' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          },
        };
      case 'profile':
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            maxWidth: '48rem',
            backgroundColor: isDarkMode ? '#111827' : '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        };
      case 'settings':
      default:
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            maxWidth: '56rem',
            backgroundColor: isDarkMode ? '#111827' : '#ffffff',
            padding: '2rem',
          },
        };
    }
  }, [pageType, isDarkMode]);
  // State for loading and UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Type guard to ensure user has required methods
  const user = useMemo<AuthenticatedUser | null>(() => {
    if (!propUser) return null;
    return propUser as AuthenticatedUser;
  }, [propUser]);

  // Form state with proper type safety
  const [formData, setFormData] = useState<FormDataState>(() => {
    const defaultAddress: UserAddress = {
      street: '',
      city: '',
      state: '',
      country: 'India',
      zipCode: ''
    };

    const defaultLocationSettings: LocationSettings = {
      type: 'auto',
      coordinates: null,
      address: '',
      city: '',
      state: '',
      country: 'India',
      zipCode: ''
    };

    return {
      displayName: propUser?.displayName || '',
      name: propUser?.name || '',
      phoneNumber: propUser?.phoneNumber || '',
      photoURL: propUser?.photoURL || null,
      address: propUser?.address || defaultAddress,
      locationSettings: propUser?.locationSettings || defaultLocationSettings,
      errors: {}
    };
  });

  // Ensure we return a valid JSX element
  if (!user) {
    return <div>Please sign in to view profile settings</div>;
  }

  // Load user data from Firestore when component mounts or user changes
  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData) {
        setPreviewUrl(userData.photoURL || user.photoURL || null);
        setFormData((prev: FormDataState) => ({
          ...prev,
          displayName: userData.displayName || user.displayName || '',
          name: userData.name || '',
          phoneNumber: userData.phoneNumber || '',
          photoURL: userData.photoURL || user.photoURL || null,
          address: userData.address || prev.address,
          locationSettings: userData.locationSettings || prev.locationSettings
        }));
      } else {
        // If no user data exists in Firestore, use auth data
        setPreviewUrl(user.photoURL || null);
        setFormData((prev: FormDataState) => ({
          ...prev,
          displayName: user.displayName || '',
          name: user.displayName || '',
          phoneNumber: user.phoneNumber || '',
          photoURL: user.photoURL || null
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user data when component mounts or user changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Format Indian phone number
  const formatIndianPhoneNumber = (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
  };

  // Handle form input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: FormDataState) => {
      // Create a deep copy of the previous state to work with
      const newState = { ...prev };
      
      // Handle phone number formatting and validation
      if (name === 'phoneNumber') {
        const numericValue = value.replace(/\D/g, '');
        const isValid = validateIndianPhoneNumber(numericValue);
        
        return {
          ...newState,
          phoneNumber: numericValue,
          errors: {
            ...newState.errors,
            phoneNumber: !numericValue 
              ? 'Phone number is required'
              : !isValid
                ? 'Please enter a valid Indian phone number'
                : ''
          }
        };
      }
      
      // Handle nested fields (address.* and locationSettings.*)
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        
        if ((parent === 'address' || parent === 'locationSettings') && child) {
          return {
            ...newState,
            [parent]: {
              ...newState[parent],
              [child]: value
            },
            errors: {
              ...newState.errors,
              [name]: ''
            }
          };
        }
      }
      
      // Handle regular fields
      return {
        ...newState,
        [name]: value,
        errors: {
          ...newState.errors,
          [name]: ''
        }
      };
    });
  }, []);

  // Toggle location type between auto and manual
  const toggleLocationType = useCallback(() => {
    setFormData((prev: FormDataState) => ({
      ...prev,
      locationSettings: {
        ...prev.locationSettings,
        type: prev.locationSettings.type === 'auto' ? 'manual' : 'auto',
      },
    }));
  }, []);

  // Handle location detection
  const handleLocationDetect = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    try {
      setIsLoading(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      setFormData((prev: FormDataState) => ({
        ...prev,
        locationSettings: {
          ...prev.locationSettings,
          type: 'auto',
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        },
      }));
      toast.success('Location detected successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Failed to detect location. Please try again or enter manually.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle file upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user.uid);

      // Get the authentication token
      const token = await user.getIdToken();
      
      // Upload the file to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the user's profile with the new photo URL
      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL
        });
      }
      
      // Update the form data with the new photo URL
      setFormData(prev => ({
        ...prev,
        photoURL: downloadURL
      }));
      
      // Update the preview
      setPreviewUrl(downloadURL);
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  // Validate Indian phone number (more lenient validation)
  const validateIndianPhoneNumber = useCallback((phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    return /^[6-9]\d{9}$/.test(cleaned);
  }, []);
  
  // Format phone number for display
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as +91 XXXXXXXXXX
    if (cleaned.length <= 2) return `+${cleaned}`;
    if (cleaned.length <= 12) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 12)}`;
  };

  // Validate form
  const validateForm = useCallback((): string | null => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validateIndianPhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Indian phone number';
    }
    
    setFormData(prev => ({
      ...prev,
      errors
    }));
    
    return Object.keys(errors).length > 0 ? 'Please fix the errors in the form' : null;
  }, [formData, validateIndianPhoneNumber]);

  // Save user data to MongoDB via API
  const saveUserData = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      const error = 'No user found in saveUserData';
      console.error(error);
      throw new Error(error);
    }
    
    try {
      console.log('Preparing user data for MongoDB...');
      
      // Get Firebase ID token
      const idToken = await user.getIdToken().catch(tokenError => {
        console.error('Error getting ID token:', tokenError);
        throw new Error('Failed to authenticate. Please try signing in again.');
      });
      
      // Prepare user data for MongoDB
      const userData = {
        userId: user.uid, // Changed from _id to userId to match API expectation
        updates: {
          displayName: (updates.displayName || user.displayName || '').trim(),
          name: (updates.name || '').trim(),
          phoneNumber: updates.phoneNumber || '',
          photoURL: updates.photoURL || user.photoURL || null,
          address: {
            street: (updates.address?.street || '').trim(),
            city: (updates.address?.city || '').trim(),
            state: (updates.address?.state || '').trim(),
            country: (updates.address?.country || 'India').trim(),
            zipCode: (updates.address?.zipCode || '').trim()
          },
          locationSettings: updates.locationSettings || {}
        }
      };
      
      // Validate required fields
      if (!userData.updates.name) {
        throw new Error('Name is required');
      }
      if (!userData.updates.phoneNumber) {
        throw new Error('Phone number is required');
      }
      if (!validateIndianPhoneNumber(userData.updates.phoneNumber)) {
        throw new Error('Please enter a valid Indian phone number');
      }
      
      console.log('Sending user data to API...');
      
      // Log the data that would be sent to the API
      console.log('User data to be saved:', JSON.stringify(userData, null, 2));
      
      // Make API call to save to MongoDB
      const apiUrl = '/api/users/update';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      const responseText = await response.text();
      console.log('API Response Status:', response.status);
      console.log('API Response:', responseText);
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(
          responseData.error || 
          responseData.message || 
          `Failed to save user data (${response.status} ${response.statusText})`
        );
      }
      
      console.log('User data successfully saved to MongoDB');
      return true;
      
      // Uncomment the following code when the API endpoint is ready
      /*
      // Make API call to save to MongoDB
      const apiUrl = '/api/users/update';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      const responseText = await response.text();
      console.log('API Response Status:', response.status);
      console.log('API Response:', responseText);
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(
          responseData.message || 
          `Failed to save user data (${response.status} ${response.statusText})`
        );
      }
      
      console.log('User data successfully saved to MongoDB');
      return true;
      */
      
    } catch (error) {
      console.error('Error in saveUserData:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    if (!user) {
      const error = 'No user found. You must be logged in to update your profile.';
      console.error(error);
      toast.error(error);
      return;
    }
    
    // Clear any previous errors and set loading state
    setFormData(prev => ({
      ...prev,
      errors: {},
      isSubmitting: true
    }));
    
    console.log('User found:', user.uid);
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      console.error('Form validation error:', validationError);
      toast.error(validationError);
      setFormData(prev => ({ ...prev, isSubmitting: false }));
      return;
    }
    
    console.log('Form validation passed');
    
    try {
      // Prepare updates with proper type safety
      const updates: Partial<User> = {
        displayName: (formData.displayName || '').trim(),
        name: (formData.name || '').trim(),
        phoneNumber: (formData.phoneNumber || '').trim(),
        photoURL: formData.photoURL || null,
        address: {
          street: formData.address?.street?.trim() || '',
          city: formData.address?.city?.trim() || '',
          state: formData.address?.state?.trim() || '',
          country: formData.address?.country?.trim() || 'India',
          zipCode: formData.address?.zipCode?.trim() || ''
        },
        locationSettings: {
          type: formData.locationSettings?.type || 'manual',
          coordinates: formData.locationSettings?.coordinates || null,
          address: formData.locationSettings?.address?.trim() || '',
          city: formData.locationSettings?.city?.trim() || '',
          state: formData.locationSettings?.state?.trim() || '',
          country: formData.locationSettings?.country?.trim() || 'India',
          zipCode: formData.locationSettings?.zipCode?.trim() || '',
          searchRadius: formData.locationSettings?.searchRadius || 10
        },
        updatedAt: new Date().toISOString()
      };
      
      console.log('Prepared updates:', JSON.stringify(updates, null, 2));

      // Update profile in Firebase Auth if display name or photo URL changed
      if (hasFirebaseAuth(user)) {
        try {
          console.log('Updating Firebase Auth profile...');
          await updateProfile(user, {
            displayName: updates.displayName || user.displayName || undefined,
            photoURL: updates.photoURL || user.photoURL || undefined
          });
          console.log('Firebase Auth profile updated');
        } catch (authError) {
          console.error('Error updating Firebase Auth profile:', authError);
          // Continue with the rest of the updates even if this fails
          toast.warning('Profile updated, but could not update authentication details');
        }
      }

      // Save user data to MongoDB
      console.log('Saving user data to MongoDB...');
      const saved = await saveUserData(updates);
      
      if (saved) {
        console.log('User data saved successfully');
        toast.success('Profile updated successfully!');
        
        // Update user context if needed
        if (onUpdate) {
          console.log('Calling onUpdate callback');
          // Create a minimal user object with required properties
          const userUpdate: User = {
            ...user,
            ...updates,
            uid: user.uid,
            email: user.email || '',
            emailVerified: false,
            isAnonymous: false,
            phoneNumber: user.phoneNumber || null,
            providerData: [],
            refreshToken: '',
            tenantId: null,
            metadata: {},
            providerId: '',
            delete: () => Promise.resolve(),
            getIdToken: user.getIdToken.bind(user),
            getIdTokenResult: () => Promise.resolve({
              token: '',
              expirationTime: '',
              authTime: '',
              issuedAtTime: '',
              signInProvider: null,
              signInSecondFactor: null,
              claims: {},
              toJSON: () => ({} as any)
            }),
            reload: () => Promise.resolve(),
            toJSON: () => ({} as any)
          };
          
          try {
            await onUpdate(userUpdate);
          } catch (updateError) {
            console.error('Error in onUpdate callback:', updateError);
            // Don't fail the entire operation if onUpdate fails
          }
        }
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error in profile update process:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error ? 
        error.message : 'An unexpected error occurred while updating your profile';
        
      toast.error(errorMessage);
      
      // Update form state with error
      setFormData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          form: errorMessage
        },
        isSubmitting: false
      }));
      
      return false;
    } finally {
      // Ensure loading state is always reset
      setFormData(prev => ({
        ...prev,
        isSubmitting: false
      }));
      console.log('Form submission finished');
    }
  }, [formData, onUpdate, user, validateForm, saveUserData]);

  // Render the form
  return (
    <div 
      style={pageStyles.container}
      className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}
    >
      <h1 style={pageStyles.title}>
        {pageType === 'dashboard' ? 'Profile' : 'Profile Settings'}
      </h1>
      
      <form onSubmit={handleSubmit} style={pageStyles.form}>
        {/* Profile Picture Upload */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <LucideUser className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
          </div>
          <div>
            <h2 className="text-lg font-medium">Profile Picture</h2>
            <p className="text-sm text-gray-500">Recommended size: 200x200 pixels</p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${formData.errors.displayName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter your display name"
          />
          {formData.errors.displayName && (
            <p className="mt-1 text-sm text-red-600">{formData.errors.displayName}</p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${formData.errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter your full name"
            required
          />
          {formData.errors.name && (
            <p className="mt-1 text-sm text-red-600">{formData.errors.name}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${formData.errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter your phone number"
            required
          />
          {formData.errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{formData.errors.phoneNumber}</p>
          )}
        </div>

        {/* Address Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-medium mb-4">Address</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address.street" className="block text-sm font-medium mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter street address"
              />
            </div>
            
            <div>
              <label htmlFor="address.city" className="block text-sm font-medium mb-1">
                City
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter city"
              />
            </div>
            
            <div>
              <label htmlFor="address.state" className="block text-sm font-medium mb-1">
                State
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter state"
              />
            </div>
            
            <div>
              <label htmlFor="address.zipCode" className="block text-sm font-medium mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter ZIP code"
              />
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Location Settings</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {formData.locationSettings.type === 'auto' ? 'Automatic' : 'Manual'}
              </span>
              <button
                type="button"
                onClick={toggleLocationType}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${formData.locationSettings.type === 'auto' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    formData.locationSettings.type === 'auto' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {formData.locationSettings.type === 'auto' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                We'll use your device's location to find restaurants near you.
              </p>
              <button
                type="button"
                onClick={handleLocationDetect}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50"
              >
                {isLoading ? 'Detecting...' : 'Detect My Location'}
              </button>
              {formData.locationSettings.coordinates && (
                <div className="mt-2 text-sm">
                  <p>Latitude: {formData.locationSettings.coordinates.lat.toFixed(6)}</p>
                  <p>Longitude: {formData.locationSettings.coordinates.lng.toFixed(6)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="locationSettings.address" className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="locationSettings.address"
                  name="locationSettings.address"
                  value={formData.locationSettings.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="locationSettings.city" className="block text-sm font-medium mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="locationSettings.city"
                    name="locationSettings.city"
                    value={formData.locationSettings.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label htmlFor="locationSettings.state" className="block text-sm font-medium mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    id="locationSettings.state"
                    name="locationSettings.state"
                    value={formData.locationSettings.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter state"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="locationSettings.country" className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="locationSettings.country"
                    name="locationSettings.country"
                    value={formData.locationSettings.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter country"
                  />
                </div>
                
                <div>
                  <label htmlFor="locationSettings.zipCode" className="block text-sm font-medium mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="locationSettings.zipCode"
                    name="locationSettings.zipCode"
                    value={formData.locationSettings.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="locationSettings.searchRadius" className="block text-sm font-medium mb-1">
                  Search Radius (km)
                </label>
                <input
                  type="number"
                  id="locationSettings.searchRadius"
                  name="locationSettings.searchRadius"
                  value={formData.locationSettings.searchRadius || ''}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter search radius in kilometers"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
