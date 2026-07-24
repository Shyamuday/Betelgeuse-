import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_CONSTANTS } from '../../core';

@Component({
  selector: 'app-payment-policy',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="bg-white">
      <section class="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-sm font-semibold uppercase text-teal-700">Legal</p>
          <h1 class="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Payment Policy</h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            This policy explains payment methods, secure verification, payment failures, retries,
            and receipts for paid Hope Hub support sessions and donations.
          </p>
          <p class="mt-3 text-sm text-slate-600">Effective date: July 24, 2026</p>
        </div>
      </section>

      <section class="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl space-y-8 text-slate-700">
          <section>
            <h2 class="text-xl font-bold text-slate-950">Accepted Payment Methods</h2>
            <p class="mt-3 leading-7">
              Hope Hub accepts online payment methods supported by Razorpay, such as UPI, cards, net
              banking, and wallets where available. Payments are collected in Indian Rupees.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-950">Secure Verification</h2>
            <p class="mt-3 leading-7">
              After checkout, payment confirmation is verified by our backend with the payment
              gateway before a booking is treated as paid. We do not store full card, UPI, or bank
              credentials on Hope Hub servers.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-950">Failed Or Cancelled Payments</h2>
            <p class="mt-3 leading-7">
              If checkout fails or is cancelled, you may retry payment from the booking flow. If
              money was debited but the booking is not confirmed, contact support with your payment
              reference so we can verify the gateway record.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-950">Refund Tracking</h2>
            <p class="mt-3 leading-7">
              Approved refunds are tracked against the original payment. Refund timing depends on
              the payment gateway, bank, UPI, card, or wallet provider. Cancellation and refund
              eligibility is explained in our
              <a
                class="font-semibold text-teal-700 hover:text-teal-800"
                routerLink="/refund-policy"
              >
                Cancellation & Refund Policy</a
              >.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-950">Receipts & Support</h2>
            <p class="mt-3 leading-7">
              Payment confirmation details may be shared by email, SMS, WhatsApp, or shown in your
              account where available. For payment help, email
              <a
                class="font-semibold text-teal-700 hover:text-teal-800"
                href="mailto:{{ APP_CONSTANTS.CONTACT.EMAIL }}"
              >
                {{ APP_CONSTANTS.CONTACT.EMAIL }} </a
              >.
            </p>
          </section>
        </div>
      </section>
    </main>
  `,
})
export class PaymentPolicyComponent {
  readonly APP_CONSTANTS = APP_CONSTANTS;
}
