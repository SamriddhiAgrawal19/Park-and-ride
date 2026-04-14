class CardPayment {
  processPayment(amount) {
    console.log(`Processing card payment of $${amount}`);
    return true; 
  }
}

class UPIPayment {
  processPayment(amount) {
    console.log(`Processing UPI payment of $${amount}`);
    return true; 
  }
}

class CashPayment {
  processPayment(amount) {
    console.log(`Processing cash payment of $${amount}`);
    return true; 
  }
}

module.exports = { CardPayment, UPIPayment, CashPayment };
