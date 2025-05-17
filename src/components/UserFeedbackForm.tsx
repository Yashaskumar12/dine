import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import nodemailer from 'nodemailer';

interface FeedbackFormData {
  priorExperience: 'yes' | 'no' | '';
  appsUsed: string;
  likedFeatures: string[];
  problemsFaced: string;
  discoveryMethod: string;
  signupReason: string;
  onboardingRating: number;
  featuresUsed: string[];
  overallRating: number;
  bugsFaced: 'yes' | 'no' | '';
  bugDetails: string;
  desiredFeatures: string[];
  futureUse: string;
  suggestions: string;
  email: string;
}

const UserFeedbackForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FeedbackFormData>({
    priorExperience: '',
    appsUsed: '',
    likedFeatures: [],
    problemsFaced: '',
    discoveryMethod: '',
    signupReason: '',
    onboardingRating: 0,
    featuresUsed: [],
    overallRating: 0,
    bugsFaced: '',
    bugDetails: '',
    desiredFeatures: [],
    futureUse: '',
    suggestions: '',
    email: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current active section (1-4)
  const [activeSection, setActiveSection] = useState(1);
  
  // Calculate completion percentage based on required fields in current section
  const calculateCompletion = () => {
    let filledFields = 0;
    let totalFields = 0;
    
    // Section 1
    if (activeSection === 1) {
      totalFields++;
      if (formData.priorExperience) filledFields++;
      
      if (formData.priorExperience === 'yes') {
        totalFields += 2;
        if (formData.appsUsed) filledFields++;
        if (formData.likedFeatures.length > 0) filledFields++;
      }
    }
    
    // Section 2
    else if (activeSection === 2) {
      totalFields += 2;
      if (formData.discoveryMethod) filledFields++;
      if (formData.signupReason) filledFields++;
    }
    
    // Section 3
    else if (activeSection === 3) {
      totalFields += 3;
      if (formData.onboardingRating > 0) filledFields++;
      if (formData.featuresUsed.length > 0) filledFields++;
      if (formData.bugsFaced) filledFields++;
      
      if (formData.bugsFaced === 'yes') {
        totalFields++;
        if (formData.bugDetails) filledFields++;
      }
    }
    
    // Section 4
    else if (activeSection === 4) {
      totalFields += 3;
      if (formData.desiredFeatures.length > 0) filledFields++;
      if (formData.futureUse) filledFields++;
      if (formData.overallRating > 0) filledFields++;
    }
    
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };
  
  const canProceedToNextSection = () => {
    if (activeSection === 1) {
      if (formData.priorExperience === '') return false;
      if (formData.priorExperience === 'yes') {
        return formData.appsUsed !== '' && formData.likedFeatures.length > 0;
      }
      return true;
    }
    
    if (activeSection === 2) {
      return formData.discoveryMethod !== '' && formData.signupReason !== '';
    }
    
    if (activeSection === 3) {
      if (formData.onboardingRating === 0 || formData.featuresUsed.length === 0 || formData.bugsFaced === '') {
        return false;
      }
      if (formData.bugsFaced === 'yes' && formData.bugDetails === '') {
        return false;
      }
      return true;
    }
    
    return true;
  };
  
  const nextSection = () => {
    if (activeSection < 4 && canProceedToNextSection()) {
      setActiveSection(activeSection + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevSection = () => {
    if (activeSection > 1) {
      setActiveSection(activeSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // First validate the form data
      if (!canProceedToNextSection()) {
        setError('Please complete all required fields in the current section');
        setIsSubmitting(false);
        return;
      }

      // Send the feedback data to the backend
      const response = await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitSuccess(true);
      
      // Navigate to dashboard after successful submission with delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again later.');
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number, onChange: (rating: number) => void }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(star)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="focus:outline-none"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={star <= (hoverRating || value) ? "#FFD700" : "none"} 
              stroke={star <= (hoverRating || value) ? "#FFD700" : "#D1D5DB"}
              strokeWidth="2"
              className="transition-all duration-200"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.button>
        ))}
      </div>
    );
  };

  const CompletionBar = ({ percentage }: { percentage: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
      <div 
        className="bg-gradient-to-r from-yellow-400 to-green-400 h-2.5 rounded-full" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white p-4 rounded-xl shadow-lg mb-4">
            <h1 className="text-4xl font-bold">
              D<span className="relative">
                i
                <span className="absolute top-2.5 left-1.5 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
              </span>neIn
              <span className="text-yellow-400">Go</span>
            </h1>
          </div>
          <h2 className="text-xl font-medium text-gray-700">Help us improve your dining experience</h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Form Container */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {submitSuccess ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h3>
              <p className="text-gray-600">Your feedback has been submitted successfully.</p>
              <p className="text-gray-500 text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              {/* Form Header with Progress Indicator */}
              <div className="bg-[#00C47D] p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-bold text-xl">Customer Feedback</h3>
                  <span className="text-white font-medium">
                    Section {activeSection} of 4
                  </span>
                </div>
                <CompletionBar percentage={calculateCompletion()} />
                <div className="flex justify-between text-xs text-white">
                  <span>Progress</span>
                  <span>{calculateCompletion()}% Complete</span>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Section 1: Prior Experience */}
                {activeSection === 1 && (
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                      Prior Experience with Digital Dining
                    </h2>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Have you used any digital dine-in apps before?</p>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="priorExperience"
                            value="yes"
                            onChange={(e) => setFormData({ ...formData, priorExperience: e.target.value as 'yes' | 'no' })}
                            className="form-radio h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="priorExperience"
                            value="no"
                            onChange={(e) => setFormData({ ...formData, priorExperience: e.target.value as 'yes' | 'no' })}
                            className="form-radio h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {formData.priorExperience === 'yes' && (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Which apps have you used before?
                          </label>
                          <input
                            type="text"
                            value={formData.appsUsed}
                            onChange={(e) => setFormData({ ...formData, appsUsed: e.target.value })}
                            placeholder="e.g., Zomato Dining, EatSure, etc."
                            className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">What features did you like most?</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {['Quick menu access via QR', 'Ordering without waiting for staff', 'Contactless payments', 
                              'Loyalty points/rewards', 'Bill splitting', 'Table reservation'].map((feature) => (
                              <label key={feature} className="flex items-center bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.likedFeatures.includes(feature)}
                                  onChange={(e) => {
                                    const newFeatures = e.target.checked
                                      ? [...formData.likedFeatures, feature]
                                      : formData.likedFeatures.filter(f => f !== feature);
                                    setFormData({ ...formData, likedFeatures: newFeatures });
                                  }}
                                  className="form-checkbox h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{feature}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            What were the biggest problems you faced?
                          </label>
                          <textarea
                            value={formData.problemsFaced}
                            onChange={(e) => setFormData({ ...formData, problemsFaced: e.target.value })}
                            className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                            rows={3}
                            placeholder="Describe any challenges or issues you encountered..."
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Section 2: Discovery */}
                {activeSection === 2 && (
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                      How You Found DineInGo
                    </h2>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        How did you first hear about DineInGo?
                      </label>
                      <select
                        value={formData.discoveryMethod}
                        onChange={(e) => setFormData({ ...formData, discoveryMethod: e.target.value })}
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                      >
                        <option value="">Select an option</option>
                        <option value="friend">A friend or colleague</option>
                        <option value="social">Social media</option>
                        <option value="qr">QR code at a restaurant</option>
                        <option value="ad">Online ad or article</option>
                        <option value="invite">Direct invitation from a restaurant</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Why did you decide to sign up?
                      </label>
                      <select
                        value={formData.signupReason}
                        onChange={(e) => setFormData({ ...formData, signupReason: e.target.value })}
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                      >
                        <option value="">Select an option</option>
                        <option value="faster">Wanted a faster dine-in experience</option>
                        <option value="partner">Trying it at a partner restaurant</option>
                        <option value="curious">Curious about the platform</option>
                        <option value="invited">Invited by someone</option>
                        <option value="exploring">Just exploring</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Section 3: Experience */}
                {activeSection === 3 && (
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                      Current Experience on DineInGo
                    </h2>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">How easy was the sign-up process?</p>
                      <StarRating 
                        value={formData.onboardingRating} 
                        onChange={(rating) => setFormData({ ...formData, onboardingRating: rating })}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">What features have you used?</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {['Scanned a restaurant QR code', 'Viewed digital menu', 'Placed an order', 
                          'Made a payment', 'Gave feedback', 'None yet'].map((feature) => (
                          <label key={feature} className="flex items-center bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.featuresUsed.includes(feature)}
                              onChange={(e) => {
                                const newFeatures = e.target.checked
                                  ? [...formData.featuresUsed, feature]
                                  : formData.featuresUsed.filter(f => f !== feature);
                                setFormData({ ...formData, featuresUsed: newFeatures });
                              }}
                              className="form-checkbox h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{feature}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Did you face any bugs or issues?</p>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="bugsFaced"
                            value="yes"
                            onChange={(e) => setFormData({ ...formData, bugsFaced: e.target.value as 'yes' | 'no' })}
                            className="form-radio h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="bugsFaced"
                            value="no"
                            onChange={(e) => setFormData({ ...formData, bugsFaced: e.target.value as 'yes' | 'no' })}
                            className="form-radio h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {formData.bugsFaced === 'yes' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Please describe the issues you faced
                        </label>
                        <textarea
                          value={formData.bugDetails}
                          onChange={(e) => setFormData({ ...formData, bugDetails: e.target.value })}
                          className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                          rows={3}
                          placeholder="Provide details about the bugs or issues..."
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Section 4: Future Features */}
                {activeSection === 4 && (
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                      Future Features & Improvements
                    </h2>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">What features would you like to see?</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {['Table reservation', 'Real-time order tracking', 'Favorite items', 
                          'Order history', 'Reward points', 'Language options', 
                          'Bill splitting', 'Restaurant ratings'].map((feature) => (
                          <label key={feature} className="flex items-center bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.desiredFeatures.includes(feature)}
                              onChange={(e) => {
                                const newFeatures = e.target.checked
                                  ? [...formData.desiredFeatures, feature]
                                  : formData.desiredFeatures.filter(f => f !== feature);
                                setFormData({ ...formData, desiredFeatures: newFeatures });
                              }}
                              className="form-checkbox h-4 w-4 text-[#00C47D] focus:ring-[#00C47D] border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{feature}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Would you use DineInGo again?</p>
                      <div className="flex flex-wrap gap-4">
                        {['definitely', 'maybe', 'not'].map((option) => {
                          const labels = {
                            'definitely': 'Definitely',
                            'maybe': 'Maybe',
                            'not': 'Not likely'
                          };
                          
                          return (
                            <label 
                              key={option}
                              className={`flex items-center justify-center px-4 py-2 rounded-lg transition-all cursor-pointer ${
                                formData.futureUse === option 
                                  ? 'bg-[#00C47D] bg-opacity-20 border-2 border-[#00C47D]' 
                                  : 'bg-gray-50 border-2 border-gray-200 hover:border-[#00C47D]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="futureUse"
                                value={option}
                                onChange={(e) => setFormData({ ...formData, futureUse: e.target.value })}
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">{labels[option as keyof typeof labels]}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Overall experience rating</p>
                      <StarRating 
                        value={formData.overallRating} 
                        onChange={(rating) => setFormData({ ...formData, overallRating: rating })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Any suggestions to make DineInGo better?
                      </label>
                      <textarea
                        value={formData.suggestions}
                        onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                        rows={3}
                        placeholder="Share your ideas for improvement..."
                      />
                    </div>
                    
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Your email (optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@email.com"
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C47D] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500">We may contact you for follow-up questions</p>
                    </div>
                  </motion.div>
                )}

                {/* Navigation/Submit Buttons */}
                <div className="pt-4 flex justify-between">
                  {activeSection > 1 ? (
                    <motion.button
                      type="button"
                      onClick={prevSection}
                      className="px-6 py-2 border border-[#00C47D] text-[#00C47D] rounded-lg font-medium text-sm shadow-sm hover:bg-[#00C47D] hover:bg-opacity-10 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Previous
                    </motion.button>
                  ) : (
                    <div></div>
                  )}
                  
                  {activeSection < 4 ? (
                    <motion.button
                      type="button"
                      onClick={nextSection}
                      disabled={!canProceedToNextSection()}
                      className={`px-6 py-2 bg-[#00C47D] text-white rounded-lg font-medium text-sm shadow-md hover:bg-opacity-90 transition-all duration-300 ${!canProceedToNextSection() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={canProceedToNextSection() ? { scale: 1.02 } : {}}
                      whileTap={canProceedToNextSection() ? { scale: 0.98 } : {}}
                    >
                      Next
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      className="px-6 py-2 bg-[#00C47D] text-white rounded-lg font-medium text-sm shadow-md hover:bg-opacity-90 transition-all duration-300 flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 DineInGo. All rights reserved.</p>
          <p className="mt-1">Your feedback helps us improve our service.</p>
        </div>
      </div>
    </div>
  );
};

export default UserFeedbackForm;