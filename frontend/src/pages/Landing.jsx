import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function FadergsLogo() {
  // Escudo com raios saindo do canto inferior esquerdo, cores adaptadas ao tema lilás
  const shieldPath = "M 4,5 L 50,5 L 50,54 Q 27,70 4,54 Z";
  const fanOrigin = { x: 8, y: 68 };
  const rayTargets = [
    [4, 5], [13, 5], [22, 5], [31, 5], [40, 5],
    [50, 5], [50, 22], [50, 38],
  ];

  return (
    <svg
      viewBox="0 0 278 74"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 222, height: 59 }}
      aria-label="FADERGS Centro Universitário"
    >
      <defs>
        <clipPath id="shieldClip">
          <path d={shieldPath} />
        </clipPath>
      </defs>

      {/* Fundo do escudo */}
      <path d={shieldPath} fill="white" />

      {/* Raios em leque, recortados ao escudo */}
      <g clipPath="url(#shieldClip)">
        {rayTargets.map(([x2, y2], i) => (
          <line
            key={i}
            x1={fanOrigin.x} y1={fanOrigin.y}
            x2={x2} y2={y2}
            stroke="#4c1d95"
            strokeWidth="2.8"
            opacity="0.82"
          />
        ))}
      </g>

      {/* Borda do escudo */}
      <path d={shieldPath} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

      {/* FADERGS */}
      <text
        x="62" y="44"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="38"
        fontWeight="bold"
        fill="white"
        letterSpacing="-0.5"
      >
        FADERGS
      </text>

      {/* CENTRO UNIVERSITÁRIO */}
      <text
        x="64" y="61"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="9.5"
        fill="rgba(255,255,255,0.75)"
        letterSpacing="2.6"
      >
        CENTRO UNIVERSIT&#193;RIO
      </text>
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.agendado) {
      setShowSuccess(true);
      window.history.replaceState({}, "");
      const t = setTimeout(() => setShowSuccess(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Logo centralizado no topo */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: 28,
        paddingBottom: 4,
      }}>
        <FadergsLogo />
      </div>

      {/* Barra de navegação */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "12px 24px 20px",
      }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", padding: "8px 20px", borderRadius: 8,
            fontSize: 13.5, fontWeight: 500, cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          Área dos Funcionários
        </button>
      </header>

      {/* Banner de confirmação de agendamento */}
      {showSuccess && (
        <div style={{
          background: "#dcfce7", color: "#166534",
          border: "1px solid #bbf7d0",
          padding: "14px 24px", textAlign: "center",
          fontSize: 14, fontWeight: 500,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          ✅ Agendamento confirmado com sucesso! Compareça no local na data e horário escolhidos.
        </div>
      )}

      {/* Hero */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 20px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 680, width: "100%" }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🌸</div>

          <h1 className="landing-title" style={{
            color: "#fff", fontSize: 72, fontWeight: 800,
            lineHeight: 1.1, marginBottom: 28,
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "-0.5px",
          }}>
            Sala Lilás
          </h1>

          <p className="landing-subtitle" style={{
            color: "rgba(255,255,255,0.92)", fontSize: 28,
            lineHeight: 1.7, marginBottom: 20,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
          }}>
            Um espaço de acolhimento, escuta e apoio especializado
            para mulheres em situação de violência.
          </p>

          <p className="landing-desc" style={{
            color: "rgba(255,255,255,0.70)", fontSize: 20,
            lineHeight: 1.8, marginBottom: 48,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontWeight: 400,
          }}>
            Oferecemos atendimento multidisciplinar com equipe técnica,
            suporte psicológico e orientação jurídica de forma segura e sigilosa.
          </p>

          <button
            onClick={() => navigate("/agendar")}
            style={{
              background: "#fff", color: "#5b21b6",
              border: "none", borderRadius: 10,
              padding: "16px 40px", fontSize: 16, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              transition: "transform 0.15s, box-shadow 0.15s",
              display: "block", width: "100%", maxWidth: 340, margin: "0 auto 16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
            }}
          >
            Agendar Atendimento
          </button>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 8 }}>
            Agendamento gratuito · Sem necessidade de cadastro · 100% sigiloso
          </p>
        </div>
      </main>

      {/* Cards informativos */}
      <section style={{
        background: "rgba(255,255,255,0.07)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "40px 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
        }}>
          {[
            {
              icon: "🤝",
              title: "Acolhimento",
              text: "Escuta qualificada e acolhimento humanizado por equipe especializada em situações de violência.",
            },
            {
              icon: "🧠",
              title: "Apoio Psicológico",
              text: "Atendimento psicológico individual para apoio emocional e fortalecimento do bem-estar.",
            },
            {
              icon: "⚖️",
              title: "Orientação Jurídica",
              text: "Informação sobre direitos, medidas protetivas e encaminhamentos para a Defensoria Pública.",
            },
          ].map(({ icon, title, text }) => (
            <div key={title} style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12, padding: "24px 20px",
              backdropFilter: "blur(6px)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="landing-footer" style={{
        padding: "18px 24px", borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          © {new Date().getFullYear()} Sala Lilás · Atendimento sigiloso conforme Lei 13.709/2018 (LGPD)
        </span>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "none", border: "none",
            color: "rgba(255,255,255,0.35)", fontSize: 12,
            cursor: "pointer", textDecoration: "underline",
          }}
        >
          Acesso de funcionários
        </button>
      </footer>
    </div>
  );
}
