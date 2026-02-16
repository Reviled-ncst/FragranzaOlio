import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Calendar, Phone, MapPin, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, Building2, Briefcase, GraduationCap, UserCheck } from 'lucide-react';
import authService from '../../services/authServicePHP';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { getDashboardForRole } from '../utils/RoleBasedRoute';
import { apiFetch, API_BASE_URL } from '../../services/api';

// User role constants
export type UserRole = 'customer' | 'sales' | 'admin' | 'ojt' | 'ojt_supervisor';

interface Supervisor {
  id: number;
  name: string;
  email: string;
}

const ROLE_OPTIONS = [
  { value: 'customer' as const, label: 'Customer', description: 'Shop for premium perfumes', icon: User },
  { value: 'ojt' as const, label: 'OJT Intern', description: 'On-the-job training program', icon: GraduationCap },
  { value: 'ojt_supervisor' as const, label: 'OJT Supervisor', description: 'Supervise OJT interns', icon: UserCheck },
  { value: 'sales' as const, label: 'Sales', description: 'Manage products and orders', icon: Briefcase },
  { value: 'admin' as const, label: 'Admin', description: 'Full system access', icon: Lock },
] as const;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation helpers
const validators = {
  email: (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
  },
  confirmPassword: (value: string, password: string) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return null;
  },
  firstName: (value: string) => {
    if (!value) return 'First name is required';
    if (value.length < 2) return 'First name must be at least 2 characters';
    if (!/^[a-zA-Z\s-']+$/.test(value)) return 'First name can only contain letters';
    return null;
  },
  lastName: (value: string) => {
    if (!value) return 'Last name is required';
    if (value.length < 2) return 'Last name must be at least 2 characters';
    if (!/^[a-zA-Z\s-']+$/.test(value)) return 'Last name can only contain letters';
    return null;
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required';
    const phoneRegex = /^(09|\+639)\d{9}$/;
    const cleanPhone = value.replace(/[\s-]/g, '');
    if (!phoneRegex.test(cleanPhone)) return 'Please enter a valid Philippine phone number (e.g., 09XX XXX XXXX)';
    return null;
  },
  birthDate: (value: string) => {
    if (!value) return 'Birth date is required';
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) return 'You must be at least 13 years old';
    if (age > 120) return 'Please enter a valid birth date';
    return null;
  },
  gender: (value: string) => {
    if (!value) return 'Please select your gender';
    return null;
  },
};

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { login, isAuthenticated } = useAuth();
  const { defaultMode } = useAuthModal();
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const totalSteps = 4; // Now 4 steps: Role, Basic Info, Contact, Account

  // Fetch supervisors when modal opens
  useEffect(() => {
    if (isOpen) {
      authService.getSupervisors().then(data => {
        setSupervisors(data);
      }).catch(err => {
        console.error('Failed to fetch supervisors:', err);
      });
    }
  }, [isOpen]);

  // Sync isLogin state with defaultMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(defaultMode === 'login');
    }
  }, [isOpen, defaultMode]);

  // Auto-close modal if user is already authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      onClose();
    }
  }, [isOpen, isAuthenticated, onClose]);
  
  const [formData, setFormData] = useState({
    // Login fields
    email: 'renzrusselbauto@gmail.com',
    password: 'Test@1234',
    // Step 1: Role Selection
    role: 'customer' as UserRole,
    // Step 2: Basic Info
    firstName: 'Renz Russel',
    lastName: 'Bauto',
    birthDate: '1995-06-15',
    gender: 'male',
    // Step 3: Contact Info
    phone: '09171234567',
    address: '123 Rizal Street, Brgy. San Antonio',
    city: 'Makati City',
    province: 'Metro Manila',
    zipCode: '1200',
    companyName: 'Fragranza Olio Inc.',
    companyPosition: 'Sales Manager',
    department: 'Sales',
    // OJT Intern specific fields
    supervisorId: '',
    university: '',
    course: '',
    requiredHours: 500,
    // Step 4: Account Setup
    confirmPassword: 'Test@1234',
    agreeTerms: true,
    subscribeNewsletter: true,
  });

  // Validate a single field
  const validateField = (name: string, value: string) => {
    let error: string | null = null;
    
    switch (name) {
      case 'email':
        error = validators.email(value);
        break;
      case 'password':
        error = validators.password(value);
        break;
      case 'confirmPassword':
        error = validators.confirmPassword(value, formData.password);
        break;
      case 'firstName':
        error = validators.firstName(value);
        break;
      case 'lastName':
        error = validators.lastName(value);
        break;
      case 'phone':
        error = validators.phone(value);
        break;
      case 'birthDate':
        error = validators.birthDate(value);
        break;
      case 'gender':
        error = validators.gender(value);
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  // Validate step fields
  const validateStep = (step: number): boolean => {
    let isValid = true;
    const errors: Record<string, string | null> = {};
    
    if (step === 1) {
      // Role selection - always valid if a role is selected
      if (!formData.role) {
        errors.role = 'Please select a role';
        isValid = false;
      }
      // OJT intern requires supervisor selection
      if (formData.role === 'ojt') {
        if (!formData.supervisorId) {
          errors.supervisorId = 'Please select a supervisor';
          isValid = false;
        }
        if (!formData.university || formData.university.length < 3) {
          errors.university = 'University is required';
          isValid = false;
        }
        if (!formData.course || formData.course.length < 3) {
          errors.course = 'Course is required';
          isValid = false;
        }
      }
    } else if (step === 2) {
      errors.firstName = validators.firstName(formData.firstName);
      errors.lastName = validators.lastName(formData.lastName);
      errors.email = validators.email(formData.email);
      errors.birthDate = validators.birthDate(formData.birthDate);
      errors.gender = validators.gender(formData.gender);
      
      // Mark all as touched
      setTouchedFields(prev => ({
        ...prev,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        gender: true,
      }));
    } else if (step === 3) {
      errors.phone = validators.phone(formData.phone);
      setTouchedFields(prev => ({ ...prev, phone: true }));
    } else if (step === 4) {
      errors.password = validators.password(formData.password);
      errors.confirmPassword = validators.confirmPassword(formData.confirmPassword, formData.password);
      setTouchedFields(prev => ({ ...prev, password: true, confirmPassword: true }));
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }));
    
    // Check if any errors exist for this step
    Object.values(errors).forEach(err => {
      if (err) isValid = false;
    });
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isLogin) {
      // Validate login fields
      const emailError = validators.email(formData.email);
      if (emailError) {
        setFieldErrors(prev => ({ ...prev, email: emailError }));
        setTouchedFields(prev => ({ ...prev, email: true }));
        return;
      }
      if (!formData.password) {
        setFieldErrors(prev => ({ ...prev, password: 'Password is required' }));
        setTouchedFields(prev => ({ ...prev, password: true }));
        return;
      }
      
      // Handle Login
      setIsLoading(true);
      try {
        const result = await authService.login({
          email: formData.email,
          password: formData.password,
        });
        
        if (result.success && result.data?.user) {
          // Update auth context
          login(result.data.user, result.data.token);
          setSuccessMessage('Login successful! Welcome back.');
          
          // Redirect based on role after short delay
          const userRole = result.data.user.role;
          setTimeout(() => {
            onClose();
            // Navigate to appropriate dashboard based on role
            const targetPath = getDashboardForRole(userRole);
            window.location.href = targetPath;
          }, 1000);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle Registration
      if (currentStep < totalSteps) {
        // Validate current step before proceeding
        if (!validateStep(currentStep)) {
          setError('Please fix the errors above before continuing');
          return;
        }
        setCurrentStep(currentStep + 1);
        setError(null);
      } else {
        // Final step - validate and submit registration
        if (!validateStep(4)) {
          setError('Please fix the errors above before continuing');
          return;
        }
        if (!formData.agreeTerms) {
          setError('You must agree to the Terms of Service and Privacy Policy');
          return;
        }
        
        setIsLoading(true);
        try {
          const result = await authService.register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            role: formData.role,
            birthDate: formData.birthDate,
            gender: formData.gender,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            province: formData.province,
            zipCode: formData.zipCode,
            subscribeNewsletter: formData.subscribeNewsletter,
            // OJT Intern specific fields
            ...(formData.role === 'ojt' && {
              supervisorId: formData.supervisorId,
              university: formData.university,
              course: formData.course,
              department: formData.department,
              requiredHours: formData.requiredHours,
            }),
          });
          
          if (result.success) {
            setSuccessMessage(result.message);
            setTimeout(() => {
              // Switch to login after successful registration
              setIsLogin(true);
              setCurrentStep(1);
              setSuccessMessage(null);
              setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            }, 3000);
          } else {
            setError(result.message);
          }
        } catch (err) {
          setError('Registration failed. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const emailError = validators.email(forgotEmail);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email: forgotEmail }),
      });
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('If an account exists with this email, you will receive a password reset link. Please check your email.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setSuccessMessage(null);
          setForgotEmail('');
        }, 5000);
      } else {
        setError(result.message || 'Failed to send reset email. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError(null); // Clear general error on input change
    
    // Real-time validation for touched fields
    if (touchedFields[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setCurrentStep(1);
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setTouchedFields({});
    setFormData({
      email: '',
      password: '',
      role: 'customer' as UserRole,
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      zipCode: '',
      confirmPassword: '',
      agreeTerms: false,
      subscribeNewsletter: false,
      companyName: '',
      companyPosition: '',
      department: '',
      // OJT fields
      supervisorId: '',
      university: '',
      course: '',
      requiredHours: 500,
    });
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  // Helper to get input class based on validation state
  const getInputClass = (fieldName: string, baseClass: string = 'border-gold-500/30 focus:border-gold-500 focus:ring-gold-500/50') => {
    const hasError = touchedFields[fieldName] && fieldErrors[fieldName];
    const isValid = touchedFields[fieldName] && !fieldErrors[fieldName] && formData[fieldName as keyof typeof formData];
    
    if (hasError) {
      return `${baseClass} border-red-500/50 focus:border-red-500 focus:ring-red-500/50`;
    }
    if (isValid) {
      return `${baseClass} border-green-500/50 focus:border-green-500 focus:ring-green-500/50`;
    }
    return baseClass;
  };

  // Field error display component
  const FieldError = ({ fieldName }: { fieldName: string }) => {
    if (!touchedFields[fieldName] || !fieldErrors[fieldName]) return null;
    return (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle size={12} />
        {fieldErrors[fieldName]}
      </p>
    );
  };

  const stepTitles = ['Account Type', 'Personal Info', 'Contact Details', 'Account Setup'];

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step < currentStep
                ? 'bg-gold-500 text-black'
                : step === currentStep
                ? 'bg-gold-500 text-black'
                : 'bg-black-700 text-gray-400'
            }`}
          >
            {step < currentStep ? <Check size={16} /> : step}
          </div>
          {step < 4 && (
            <div
              className={`w-8 h-0.5 mx-1 transition-all ${
                step < currentStep ? 'bg-gold-500' : 'bg-black-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Check if role needs company fields
  const needsCompanyFields = ['supplier', 'sales', 'inventory', 'finance', 'admin'].includes(formData.role);

  // Render registration steps
  const renderRegistrationStep = () => {
    const inputBaseClass = "w-full pl-10 pr-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all";
    const selectBaseClass = "w-full px-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all";
    
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1-role"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-gray-400 text-sm text-center mb-4">
              Select how you'll be using Fragranza Olio
            </p>
            <div className="grid gap-3">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    // Pre-fill data based on role selection
                    if (role.value === 'sales') {
                      setFormData(prev => ({
                        ...prev,
                        role: role.value,
                        email: 'vendor0qw@gmail.com',
                        firstName: 'Sales',
                        lastName: 'Representative',
                      }));
                    } else if (role.value === 'ojt') {
                      setFormData(prev => ({
                        ...prev,
                        role: role.value,
                        supervisorId: supervisors.length > 0 ? String(supervisors[0].id) : '',
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, role: role.value }));
                    }
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    formData.role === role.value
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-gold-500/20 bg-black-800 hover:border-gold-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.role === role.value ? 'bg-gold-500 text-black' : 'bg-black-700 text-gray-400'
                    }`}>
                      <role.icon size={18} />
                    </div>
                    <div>
                      <p className={`font-medium ${formData.role === role.value ? 'text-gold-500' : 'text-white'}`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                    {formData.role === role.value && (
                      <Check size={20} className="ml-auto text-gold-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* OJT Intern specific fields */}
            {formData.role === 'ojt' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-4 border-t border-gold-500/20"
              >
                <h4 className="text-sm font-medium text-gold-400">OJT Details</h4>
                
                {/* Supervisor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Supervisor <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="supervisorId"
                    value={formData.supervisorId}
                    onChange={handleChange}
                    className={selectBaseClass}
                  >
                    {supervisors.length === 0 ? (
                      <option value="">No supervisors available</option>
                    ) : (
                      supervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                {/* University */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    University <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      placeholder="e.g., Polytechnic University of the Philippines"
                      className={inputBaseClass}
                    />
                  </div>
                </div>
                
                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Course <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="e.g., BS Information Technology"
                      className={inputBaseClass}
                    />
                  </div>
                </div>
                
                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={selectBaseClass}
                  >
                    <option value="IT Department">IT Department</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="E-commerce Operations">E-commerce Operations</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  First Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Juan"
                    className={getInputClass('firstName', inputBaseClass)}
                  />
                </div>
                <FieldError fieldName="firstName" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Dela Cruz"
                    className={getInputClass('lastName', inputBaseClass)}
                  />
                </div>
                <FieldError fieldName="lastName" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="juan@example.com"
                  className={getInputClass('email', inputBaseClass)}
                />
              </div>
              <FieldError fieldName="email" />
            </div>

            {/* Birth Date & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Birth Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass('birthDate', inputBaseClass)}
                  />
                </div>
                <FieldError fieldName="birthDate" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Gender <span className="text-red-400">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('gender', selectBaseClass)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
                <FieldError fieldName="gender" />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3-contact"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="09XX XXX XXXX"
                  className={getInputClass('phone', inputBaseClass)}
                />
              </div>
              <FieldError fieldName="phone" />
            </div>

            {/* Company fields for non-customer roles */}
            {needsCompanyFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Fragranza Olio Inc."
                      className="w-full pl-10 pr-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Position/Title
                    </label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        name="companyPosition"
                        value={formData.companyPosition}
                        onChange={handleChange}
                        placeholder="Sales Manager"
                        className="w-full pl-10 pr-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Sales"
                      className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Street Address
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Barangay"
                  className="w-full pl-10 pr-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                />
              </div>
            </div>

            {/* City & Province */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  City/Municipality
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Quezon City"
                  className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="Metro Manila"
                  className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                />
              </div>
            </div>

            {/* ZIP Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                ZIP Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="1100"
                className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min. 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 bg-black-800 border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${getInputClass('password')}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError fieldName="password" />
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      const strength = 
                        (formData.password.length >= 8 ? 1 : 0) +
                        (/[A-Z]/.test(formData.password) ? 1 : 0) +
                        (/[a-z]/.test(formData.password) ? 1 : 0) +
                        (/[0-9]/.test(formData.password) ? 1 : 0);
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= strength
                              ? strength <= 1
                                ? 'bg-red-500'
                                : strength <= 2
                                ? 'bg-orange-500'
                                : strength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    Use 8+ characters with uppercase, lowercase & numbers
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-3 py-2.5 bg-black-800 border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${getInputClass('confirmPassword')}`}
                  required
                />
              </div>
              <FieldError fieldName="confirmPassword" />
            </div>

            {/* Terms & Newsletter */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500/50"
                  required
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300">
                  I agree to the <a href="#" className="text-gold-400 hover:underline">Terms of Service</a> and <a href="#" className="text-gold-400 hover:underline">Privacy Policy</a> <span className="text-red-400">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="subscribeNewsletter"
                  checked={formData.subscribeNewsletter}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500/50"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300">
                  Subscribe to newsletter for exclusive offers and updates
                </span>
              </label>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Don't render if authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-black-900 border border-gold-500/30 rounded-xl shadow-2xl overflow-hidden my-auto"  
            >
              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="pt-8 pb-4 px-8 text-center">
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  {showForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : stepTitles[currentStep - 1])}
                </h2>
                <p className="text-gray-400 text-sm">
                  {showForgotPassword
                    ? 'Enter your email to receive a reset link'
                    : (isLogin
                      ? 'Sign in to access your account'
                      : `Step ${currentStep} of ${totalSteps}`)}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mx-8 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mx-8 mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm text-center">{successMessage}</p>
                </div>
              )}

              {/* Step Indicator (Register only) */}
              {!isLogin && !showForgotPassword && <StepIndicator />}

              {/* Forgot Password Form */}
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="px-8 pb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-3 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="px-8 pb-8">
                {isLogin ? (
                  /* Login Form */
                  <div className="space-y-4">
                    {/* Email field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your email"
                          className={`w-full pl-10 pr-3 py-2.5 bg-black-800 border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${getInputClass('email')}`}
                          required
                        />
                      </div>
                      <FieldError fieldName="email" />
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot password */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gold-500/20" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-black-900 text-gray-500">or continue with</span>
                      </div>
                    </div>

                    {/* Social login buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 py-2.5 border border-gold-500/20 rounded-lg text-white text-sm hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 py-2.5 border border-gold-500/20 rounded-lg text-white text-sm hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Registration Form */
                  <div className="space-y-5">
                    <AnimatePresence mode="wait">
                      {renderRegistrationStep()}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-2">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={goBack}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={18} />
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                          currentStep === 1 ? 'w-full' : ''
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {currentStep === totalSteps ? 'Creating...' : 'Please wait...'}
                          </>
                        ) : (
                          <>
                            {currentStep === totalSteps ? 'Create Account' : 'Continue'}
                            {currentStep < totalSteps && <ChevronRight size={18} />}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Switch mode */}
                {!showForgotPassword && (
                <p className="text-center text-gray-400 text-sm mt-6">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
                )}
              </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
