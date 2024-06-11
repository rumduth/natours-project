import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourID) => {
  // 1. get the session from the server
  const stripe = Stripe(
    'pk_test_51PQH6uJt6vamezlaUmbm5OIX96u8Hgx2RqZmLO33qJXF1PvueS4QslLOuMpwxj0bFHew22SBAfR9hQbNPQYtwO9800wmbHjEwv',
  );
  try {
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourID}`,
    );
    //2 . create checkout form + change credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
