
import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Auth.css";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name },
                    },
                });

                if (error) throw error;

                if (!data.session) {
                    setMessage("Account created! Please check your email to verify it.");
                }
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-logo">F</div>
                <p className="auth-eyebrow">YOUR PERSONAL PRODUCTIVITY HUB</p>
                <h1>{isLogin ? "Welcome back." : "Create your account."}</h1>
                <p className="auth-subtitle">
                    {isLogin
                        ? "Sign in to continue your productivity journey."
                        : "Start organizing your day with FocusFlow."}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <label>
                            Full Name
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Email Address
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password (minimum 6 characters)"
                            minLength={6}
                            required
                        />
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Please wait..."
                            : isLogin
                                ? "Sign In"
                                : "Create Account"}
                    </button>
                </form>

                {message && <p className="auth-message">{message}</p>}

                <p className="auth-switch">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage("");
                        }}
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </p>
            </section>
        </main>
    );
}
