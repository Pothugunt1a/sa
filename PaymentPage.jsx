import { CardElement } from '@stripe/react-stripe-js';

const handleSubmit = async (event) => {
  event.preventDefault();
  setIsLoading(true);

  if (!stripe || !elements) return;

  const cardElement = elements.getElement(CardElement);
  const amountInCents = amount * 100;

  try {
    const response = await fetch('https://shashikala-backend-v1.onrender.com/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountInCents, email }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { clientSecret, error } = await response.json();

    // ... rest of your payment processing logic
  } catch (error) {
    console.error('Fetch error:', error);
    setModalMessage(`Transaction failed: ${error.message}`);
    setIsModalOpen(true);
  } finally {
    setIsLoading(false);
  }
};
