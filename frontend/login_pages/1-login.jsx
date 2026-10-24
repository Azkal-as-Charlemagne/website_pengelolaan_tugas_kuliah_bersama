import './Login.css'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5l3.2 3L13 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function Login() {
  const handleSubmit = (e) => {
    e.preventDefault()
    // nanti: kirim data login ke backend di sini
  }

  return (
    <div className="login-page">
      {/* ===== Sisi kiri ===== */}
      <section className="login-left">
        <div className="brand">
          <div className="brand-icon">
            <CheckIcon />
          </div>
          <span className="brand-name">Belajar Bareng</span>
        </div>

        <div className="hero">
          <h1>
            Tugas kuliah beres,
            <br />
            bareng-bareng.
          </h1>
          <ul className="features">
            <li>
              <CheckIcon />
              <span>Buat grup belajar dan undang teman lewat kode atau undangan.</span>
            </li>
            <li>
              <CheckIcon />
              <span>Bagi tugas per mata kuliah dan pantau progres tiap anggota.</span>
            </li>
            <li>
              <CheckIcon />
              <span>Pengingat deadline masuk otomatis ke notifikasi kamu.</span>
            </li>
          </ul>
        </div>

        <div className="task-preview">
          <div className="task-top">
            <h3>Laporan Praktikum Basis Data</h3>
            <span className="badge-urgent">Urgent</span>
          </div>
          <p className="task-meta">Basis Data · Deadline Jumat, 23.59</p>
          <div className="progress">
            <div className="progress-fill" style={{ width: '60%' }} />
          </div>
          <p className="task-meta">3 dari 5 anggota sudah selesai</p>
        </div>
      </section>

      {/* ===== Sisi kanan ===== */}
      <section className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Masuk</h2>
          <p className="subtitle">Lanjutkan ke grup dan tugasmu.</p>

          <div className="alert">
            <LockIcon />
            <span>
              Akun dikunci sementara setelah 5 kali gagal masuk. Coba lagi pukul 02.45 WIB.
            </span>
          </div>

          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="nama@kampus.ac.id" />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="Minimal 8 karakter" />

          <div className="row-options">
            <label className="remember" htmlFor="remember">
              <input id="remember" type="checkbox" />
              Ingat saya
            </label>
            <a href="#">Lupa password?</a>
          </div>

          <button type="submit" className="btn-primary">Masuk</button>

          <p className="signup">
            Belum punya akun? <a href="/register">Daftar sekarang</a>
          </p>
        </form>
      </section>
    </div>
  )
}

export default Login
