import api from './api';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  inquiryType: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
  };
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
}

export const contactService = {
  // Submit contact form
  submitContact: async (data: ContactFormData): Promise<ContactResponse> => {
    return api.post('/contact.php', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      inquiry_type: data.inquiryType,
      message: data.message,
    });
  },

  // Subscribe to newsletter
  subscribeNewsletter: async (email: string): Promise<NewsletterResponse> => {
    return api.post('/newsletter.php', { email });
  },
};

export default contactService;
