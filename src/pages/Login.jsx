import './Login.css'

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4.1667 10.8333L7.5 14.1667L15.8333 5.8333"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect
        x="4.1667"
        y="9.1667"
        width="11.6667"
        height="7.5"
        rx="1.6667"
        stroke="currentColor"
        strokeWidth="1.6667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.6667 9.1667V6.6667a3.3333 3.3333 0 0 1 6.6666 0v2.5"
        stroke="currentColor"
        strokeWidth="1.6667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BrandIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M12.6667 14.5H27.3334M12.6667 20H21.8334M12.6667 25.5H27.3334"
        stroke="white"
        strokeWidth="1.8333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.5833 18.1667L26.4166 20L29.1666 17.25"
        stroke="white"
        strokeWidth="1.8333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      {/* ===== Panel kiri ===== */}
      <section className="login-left">
        <div className="brand">
          <div className="brand-icon">
            <BrandIcon />
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

        <div className="task-card">
          <div className="task-top">
            <h3>Laporan Praktikum Basis Data</h3>
            <span className="badge-urgent">Urgent</span>
          </div>
          <p className="task-meta">Basis Data · Deadline Jumat, 23.59</p>
          <div className="progress">
            <div className="progress-fill" />
          </div>
          <p className="task-meta task-meta--light">3 dari 5 anggota sudah selesai</p>
        </div>
      </section>

      {/* ===== Panel kanan ===== */}
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

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="nama@kampus.ac.id" />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Minimal 8 karakter" />
          </div>

          <div className="row-options">
            <label className="remember" htmlFor="remember">
              <input id="remember" type="checkbox" />
              Ingat saya
            </label>
            <a href="#" className="link-forgot">Lupa password?</a>
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