export const metadata = {
  title: "Assistente Teológico — Igreja Seara",
  description: "Pergunte sobre os sermões, textos bíblicos e teologia da Igreja Seara",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: "#fdfaf6" }}>
        {children}
      </body>
    </html>
  );
}
