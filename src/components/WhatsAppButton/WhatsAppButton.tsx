
import styles from "./WhatsAppButton.module.css";

const WHATSAPP_NUMBER = "918074543183";

const SUPPORT_MESSAGE =
  "Hello Silver Hub Team! I need assistance with your jewellery products. Could you please help me?";

export default function WhatsAppButton() {
  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    SUPPORT_MESSAGE
  )}`;

  return (
    <a
      href={whatsappURL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsappFloat}
      aria-label="Chat with Silver Hub customer support"
      title="Chat with us"
    >
      <svg
        viewBox="0 0 32 32"
        width="32"
        height="32"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.01 3C8.84 3 3 8.82 3 15.98c0 2.3.61 4.55 1.77 6.54L3 29l6.65-1.74a13 13 0 0 0 6.36 1.66h.01C23.18 28.92 29 23.1 29 15.94A12.93 12.93 0 0 0 16.01 3Zm0 23.75h-.01c-1.93 0-3.83-.52-5.48-1.51l-.39-.23-3.95 1.04 1.05-3.85-.25-.4a10.72 10.72 0 0 1-1.65-5.82c0-5.9 4.8-10.7 10.7-10.7 2.86 0 5.55 1.12 7.57 3.14a10.63 10.63 0 0 1 3.13 7.57c0 5.9-4.8 10.76-10.72 10.76Zm5.88-8.04c-.32-.16-1.9-.94-2.2-1.04-.3-.11-.51-.16-.73.16-.21.32-.84 1.04-1.03 1.25-.19.21-.38.24-.7.08-.33-.16-1.38-.51-2.62-1.63-.97-.86-1.63-1.93-1.82-2.26-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.87.4-.3.32-1.14 1.11-1.14 2.71 0 1.6 1.17 3.15 1.33 3.36.16.22 2.3 3.51 5.57 4.92.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.1 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.62-.38Z" />
      </svg>

      <span className={styles.tooltip}>Chat with us</span>
    </a>
  );
}
