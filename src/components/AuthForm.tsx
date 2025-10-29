import React, { useEffect, useRef, useState } from "react";
import { supabase, supabaseAdmin } from "../supabaseClient";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

const IMG_LOGIN = "/image/HourseLogin_wide.jpg";
const IMG_REGISTER = "/image/HourseCreate_wide.jpg";

const TUNING = {
  login:    { scale: 0.27, x: -911, y: 370 },  
  register: { scale: 0.27, x: 911, y: 370 },  
};

type AuthMode = "login" | "register";

const OVERLAY_DURATION_MS = 2000;
const IMAGE_SWAP_DELAY_MS = 900;
      
const COLORS = {
  primary: "#21386e",
  primaryHover: "#1a2c59",
  primaryAccent: "#6c8fdf",
  primarySoft: "#3b5ba0", 
  highlight: "#85a2ff",
};

const LogoIcon = () => (
  <div
    className="p-2 rounded-lg shadow-[0_12px_30px_rgba(20,35,70,0.35)]"
    style={{ backgroundColor: COLORS.primary }}
  >
    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l10 5.5v11L12 22 2 17.5v-11L12 2z" />
    </svg>
  </div>
);

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [visualMode, setVisualMode] = useState<AuthMode>("login");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const swapTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [showPwLogin, setShowPwLogin] = useState(false);
  const [showPwReg, setShowPwReg] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ username: "", email: "", password: "" });

  const isLogin = mode === "login";

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      if (swapTimeoutRef.current) {
        window.clearTimeout(swapTimeoutRef.current);
        swapTimeoutRef.current = null;
      }
    };
  }, []);

  const startModeTransition = (nextMode: AuthMode) => {
    if (mode === nextMode && !isTransitioning) return;

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (swapTimeoutRef.current) {
      window.clearTimeout(swapTimeoutRef.current);
      swapTimeoutRef.current = null;
    }

    setIsTransitioning(true);

    if (mode !== nextMode) {
      setMode(nextMode);
    }

    swapTimeoutRef.current = window.setTimeout(() => {
      setVisualMode(nextMode);
      swapTimeoutRef.current = null;
    }, IMAGE_SWAP_DELAY_MS);

    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      transitionTimeoutRef.current = null;
    }, OVERLAY_DURATION_MS);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingLogin(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: login.email.trim(),
        password: login.password,
      });
      if (signInError) { setError(signInError.message); return; }
      window.location.reload();
    } catch (err: any) {
      setError(err?.message ?? "Ocurrió un error inesperado.");
    } finally { setLoadingLogin(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingReg(true);
    try {
      const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: reg.email.trim(),
        password: reg.password,
        email_confirm: false,
      });
      if (signUpError) { setError(signUpError.message); return; }

      const user = data.user;
      if (user?.id) {
        const roleId = 7;
        const { error: insertError } = await supabaseAdmin.from("erp_user").insert([{
          uid: user.id,
          username: reg.username,
          email: reg.email.trim(),
          isapproved: false,
          fk_idUserRole: roleId,
          approved_at: null,
        }]);
        if (insertError) throw new Error(insertError.message);

        setError("Tu cuenta fue creada y está pendiente de aprobación por un administrador.");
        setReg({ username: "", email: "", password: "" });
        startModeTransition("login");
      }
    } catch (err: any) {
      setError(err?.message ?? "Ocurrió un error inesperado.");
    } finally { setLoadingReg(false); }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 text-white"
      style={{
        background:
          "radial-gradient(circle at 30% 18%, rgba(82,115,191,0.18) 0%, rgba(7,12,25,1) 55%)",
      }}
    >
      {/* CARD */}
      <div className="relative w-full max-w-6xl">
        
        <div
          className="rounded-[30px] p-[2px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(148,184,255,0.82) 8%, rgba(65,110,210,0.68) 28%, rgba(33,56,110,0.58) 55%, rgba(124,168,255,0.8) 92%)",
            boxShadow:
              "0 45px 160px -40px rgba(64,109,220,0.62), 0 0 60px rgba(120,175,255,0.45), inset 0 0 24px rgba(120,170,255,0.25)",
          }}
        >
          <div className="relative h-[720px] md:h-[640px] overflow-hidden rounded-[28px] border border-white/5 bg-[#040b16]/92 backdrop-blur-xl shadow-[0_28px_80px_rgba(6,12,26,0.85)]">

            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#21386e]/25 blur-3xl z-0" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#16264a]/30 blur-3xl z-0" />
            <div
              className="pointer-events-none absolute inset-0 rounded-[28px] z-0"
              style={{
                boxShadow:
                  "0 0 140px rgba(136,185,255,0.18), inset 0 0 55px rgba(82,130,230,0.18)",
              }}
            />  

            <div
              className={`
                absolute z-10
                h-[2500px] w-[2500px]
                rounded-full
                transition-transform duration-[1800ms]
                ease-[cubic-bezier(0.22,0.61,0.36,1)]
                pointer-events-none
                hidden md:block
              `}
              style={{
                top: "-8%",
                left: "50%",
                transform: `translate3d(-50%,-50%,0) translateX(${isLogin ? "49%" : "-49%"})`,
                willChange: "transform",
              }}
            >
             
              <div className="absolute inset-0 rounded-full bg-black/85 shadow-[0_0_120px_rgba(0,0,0,0.6)]" />
        
              <div className="absolute inset-0 overflow-hidden rounded-full">
       
                <img
                  src={IMG_LOGIN}
                  alt="Caballo login"
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                    visualMode === "login" && !isTransitioning ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    transform: `translate(${TUNING.login.x}px, ${TUNING.login.y}px) scale(${TUNING.login.scale})`,
                    transformOrigin: "center center",
                  }}
                />
          
                <img
                  src={IMG_REGISTER}
                  alt="Caballo registro"
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                    visualMode === "register" && !isTransitioning ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    transform: `translate(${TUNING.register.x}px, ${TUNING.register.y}px) scale(${TUNING.register.scale})`,
                    transformOrigin: "center center",
                  }}
                />
               
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                    isTransitioning ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    animation: isTransitioning
                      ? `arcReveal ${OVERLAY_DURATION_MS}ms ease-in-out both`
                      : "none",
                    willChange: "transform, opacity",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `
                        radial-gradient(circle at 32% 28%, rgba(123,158,230,0.22), transparent 60%),
                        radial-gradient(circle at 72% 52%, rgba(94,132,208,0.28), transparent 66%),
                        radial-gradient(circle at 68% 78%, rgba(62,94,164,0.22), transparent 72%),
                        linear-gradient(135deg, rgba(8,14,28,0.95) 10%, rgba(21,56,110,0.92) 45%, rgba(26,48,104,0.9) 72%, rgba(9,16,34,0.94) 96%)
                      `,
                      boxShadow: "0 0 150px rgba(46,72,133,0.28)",
                    }}
                  />
                  <div
                    className="absolute inset-[14%] rounded-full opacity-70"
                    style={{
                      background:
                        "radial-gradient(circle at 35% 30%, rgba(168,194,255,0.35), transparent 60%)",
                      filter: "blur(55px)",
                    }}
                  />
                  <div
                    className="absolute inset-[8%] rounded-full opacity-65 mix-blend-screen"
                    style={{
                      background:
                        "radial-gradient(circle at 65% 55%, rgba(124,156,235,0.3), transparent 70%)",
                      filter: "blur(50px)",
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border border-[#6c8fdf]/25 mix-blend-screen opacity-70" />
                </div>
               
                <div className="absolute inset-0 bg-black/30" />
              </div>
            </div>

            <div className="block md:hidden absolute inset-0 z-10">
              <img
                src="/image/HourseLogin_wide.jpg"
                alt="Country Club"
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            </div>


            {/* IZQUIERDA: LOGIN */}
            <div className="absolute inset-y-0 left-0 w-full md:w-1/2 z-[60] flex items-center justify-center px-6 md:px-14">
              <form
                onSubmit={handleLogin}
                className={`w-full max-w-md transition-opacity ease-in-out ${isLogin ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                style={{ transitionProperty: "opacity", transitionDuration: isLogin ? "8500ms" : "50ms" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <LogoIcon />
                  <div>
                    <h2 className="text-2xl font-bold">Country Club</h2>
                    <p className="text-sm text-gray-300">Bienvenido al panel de gestión</p>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4">Iniciar sesión</h3>

                <label className="block text-sm text-gray-300 mb-1">Correo electrónico</label>
                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={login.email}
                    onChange={(e) => setLogin((s) => ({ ...s, email: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#111c24] border border-[#1f3747] rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[rgba(108,143,223,0.65)] placeholder-gray-500"
                    placeholder="tu@correo.com"
                  />
                </div>

                <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
                <div className="relative mb-3">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPwLogin ? "text" : "password"}
                    value={login.password}
                    onChange={(e) => setLogin((s) => ({ ...s, password: e.target.value }))}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-[#111c24] border border-[#1f3747] rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[rgba(108,143,223,0.65)] placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwLogin((x) => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6c8fdf]" aria-label="Mostrar/Ocultar contraseña">
                    {showPwLogin ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm mb-5">
                  <a href="/reset-password" className="text-[#6c8fdf] hover:text-[#85a2ff] font-medium">¿Olvidaste la contraseña?</a>
                  <button type="button" onClick={() => startModeTransition("register")} className="text-gray-300 hover:text-white">Crear cuenta</button>
                </div>

                <button type="submit" disabled={loadingLogin} className="w-full bg-[#21386e] hover:bg-[#1a2c59] font-semibold py-3 rounded-full shadow-md shadow-[0_18px_45px_rgba(33,56,110,0.28)] disabled:opacity-60">
                  {loadingLogin ? "Entrando..." : "Entrar"}
                </button>

                {isLogin && error && <p className="mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-700 text-white">{error}</p>}
              </form>
            </div>

            {/* DERECHA: REGISTRO */}
            <div className="absolute inset-y-0 right-0 w-full md:w-1/2 z-[60] flex items-center justify-center px-6 md:px-14">
              <form
                onSubmit={handleRegister}
                className={`w-full max-w-md transition-opacity ease-in-out ${!isLogin ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                style={{ transitionProperty: "opacity", transitionDuration: !isLogin ? "8500ms" : "50ms" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <LogoIcon />
                  <div>
                    <h2 className="text-2xl font-bold">Country Club</h2>
                    <p className="text-sm text-gray-300">Crea tu cuenta</p>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4">Registro</h3>

                <label className="block text-sm text-gray-300 mb-1">Nombre de usuario</label>
                <div className="relative mb-4">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={reg.username}
                    onChange={(e) => setReg((s) => ({ ...s, username: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#111c24] border border-[#1f3747] rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[rgba(108,143,223,0.65)] placeholder-gray-500"
                    placeholder="usuario123"
                  />
                </div>

                <label className="block text-sm text-gray-300 mb-1">Correo electrónico</label>
                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={reg.email}
                    onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#111c24] border border-[#1f3747] rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[rgba(108,143,223,0.65)] placeholder-gray-500"
                    placeholder="tu@correo.com"
                  />
                </div>

                <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
                <div className="relative mb-5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPwReg ? "text" : "password"}
                    value={reg.password}
                    onChange={(e) => setReg((s) => ({ ...s, password: e.target.value }))}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-[#111c24] border border-[#1f3747] rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[rgba(108,143,223,0.65)] placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwReg((x) => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6c8fdf]" aria-label="Mostrar/Ocultar contraseña">
                    {showPwReg ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm mb-5">
                  <button type="button" onClick={() => startModeTransition("login")} className="text-gray-300 hover:text-white">¿Ya tienes cuenta? Inicia sesión</button>
                  <button type="submit" disabled={loadingReg} className="bg-[#21386e] hover:bg-[#1a2c59] font-semibold px-5 py-3 rounded-full shadow-md shadow-[0_18px_45px_rgba(33,56,110,0.28)] disabled:opacity-60">
                    {loadingReg ? "Creando..." : "Crear cuenta"}
                  </button>
                </div>

                {!isLogin && error && <p className="mt-2 p-3 rounded-lg text-sm text-center font-medium bg-red-700 text-white">{error}</p>}
              </form>
            </div>

            {/* CTA derecho (LOGIN visible) */}
            <div
              className={`absolute inset-y-0 right-0 w-full md:w-1/2 z-[20] flex`}
            >
              <div
                className={`h-full w-full flex items-end justify-center px-6 md:px-10 pb-16 md:pb-5 transition-opacity ease-in-out ${
                  isLogin ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
              </div>
            </div>


            {/* CTA izquierdo (REGISTRO visible) */}
            <div
              className={`absolute inset-y-0 left-0 w-full md:w-1/2 z-[20] flex`}
            >
              <div
                className={`h-full w-full flex items-end justify-center px-6 md:px-10 pb-16 md:pb-5 transition-opacity ease-in-out ${
                  !isLogin ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500">
              COPYRIGHT 2025 COUNTRY CLUB HIPICA
            </p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-[10%] bottom-0 h-20 rounded-full blur-[120px] opacity-60 md:opacity-80"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(170,205,255,0.5) 0%, rgba(90,135,235,0.35) 45%, rgba(40,65,140,0.0) 76%)",
          }}
        />
      </div>
    </div>
  );
}
