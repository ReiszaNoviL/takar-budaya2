/**
 * TAKAR BUDAYA - Tata Kalkulasi Partisipasi Budaya
 * Mendukung 3 Modul yang Masing-Masing Berdiri Sendiri:
 * 1. Outdoor (Metode Herbert Jacobs: P = A x D)
 * 2. Indoor (Pelatihan / Sarasehan / Workshop / Isi Sendiri)
 * 3. Hitung Seniman (Teknik Kategori Peran / Clustering: Utama + Pendukung + Pemusik)
 */

(function () {
  'use strict';

  // --- STATE APLIKASI ---
  const state = {
    namaAcara: 'Pentas Seni & Budaya',
    tglAcara: '',
    jamAcara: '19.30 - 23.30 WIB',

    // Modul aktif saat ini: 'outdoor' | 'indoor' | 'seniman'
    activeModule: 'outdoor',

    // --- MODUL 1: OUTDOOR (Metode Jacobs P = A x D) ---
    areaMode: 'quick', // 'quick' | 'custom'
    quickAreaVal: 1000,
    customSubMode: 'pl', // 'pl' | 'total'
    panjang: 40,
    lebar: 25,
    totalLuasCustom: 1000,
    activeArea: 1000,
    descArea: 'Luas area penonton terhitung (1.000 m²)',

    density: 1.0,
    densityTitle: 'Sedang / Nyaman (Aman)',
    densityDesc: 'Kondisi normal wajar, penonton leluasa tanpa berdesakan',
    totalOutdoor: 1000,

    // --- MODUL 2: INDOOR (Kegiatan Ruangan) ---
    indoorTypeMode: 'Pelatihan', // 'Pelatihan' | 'Sarasehan' | 'Workshop' | 'custom'
    indoorCustomName: 'Diskusi Budaya',
    indoorCategoryNote: 'Kegiatan pelatihan keterampilan seni, adat, tradisi, atau bimbingan teknis budaya.',
    indoorCount: 50,

    // --- MODUL 3: HITUNG SENIMAN (Teknik Clustering) ---
    senimanUtama: 5,
    senimanPendukung: 5,
    senimanPemusik: 5,
    totalSeniman: 15
  };

  // Helper Elements
  const el = (id) => document.getElementById(id);

  function setElText(id, text) {
    const target = el(id);
    if (target) target.textContent = text;
  }

  function formatIDRNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
  }

  function formatTanggalID(dateStr) {
    if (!dateStr) return 'Belum ditentukan';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (e) {
      console.warn('Format tanggal gagal:', e);
    }
    return dateStr;
  }

  function getActiveIndoorName() {
    if (state.indoorTypeMode === 'custom') {
      return state.indoorCustomName.trim() || 'Kegiatan Indoor';
    }
    return state.indoorTypeMode;
  }

  // --- INISIALISASI ---
  function initApp() {
    initDefaultDate();
    bindEventInputs();
    bindModuleTabs();
    bindOutdoorControls();
    bindIndoorControls();
    bindSenimanControls();
    bindActionButtons();
    recalculateAll();
  }

  // Set default tanggal hari ini
  function initDefaultDate() {
    const inputTgl = el('tglAcara');
    if (inputTgl) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      inputTgl.value = todayStr;
      state.tglAcara = todayStr;
    }
  }

  // Bind input nama acara, tanggal, jam
  function bindEventInputs() {
    const inputNama = el('namaAcara');
    const inputTgl = el('tglAcara');
    const inputJam = el('jamAcara');

    if (inputNama) {
      inputNama.addEventListener('input', (e) => {
        state.namaAcara = e.target.value.trim() || 'Pentas Seni & Budaya';
      });
    }

    if (inputTgl) {
      inputTgl.addEventListener('change', (e) => {
        state.tglAcara = e.target.value;
      });
    }

    if (inputJam) {
      inputJam.addEventListener('input', (e) => {
        state.jamAcara = e.target.value.trim() || '-';
      });
    }
  }

  // --- NAVIGASI 3 TAB MODUL (MASING-MASING BERDIRI SENDIRI) ---
  function bindModuleTabs() {
    const tabBtns = document.querySelectorAll('#moduleTabs .module-tab-btn');
    const panelOutdoor = el('panelModuleOutdoor');
    const panelIndoor = el('panelModuleIndoor');
    const panelSeniman = el('panelModuleSeniman');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mod = btn.getAttribute('data-module');
        if (!mod) return;

        state.activeModule = mod;

        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (panelOutdoor) panelOutdoor.classList.toggle('hidden', mod !== 'outdoor');
        if (panelIndoor) panelIndoor.classList.toggle('hidden', mod !== 'indoor');
        if (panelSeniman) panelSeniman.classList.toggle('hidden', mod !== 'seniman');

        recalculateAll();
      });
    });
  }

  // --- MODUL 1: OUTDOOR (A & D) ---
  function bindOutdoorControls() {
    const quickBtns = document.querySelectorAll('#quickAreaGroup .quick-btn');
    const customBox = el('customAreaBox');
    const tabPL = el('tabModePL');
    const tabTotal = el('tabModeTotal');
    const panelPL = el('panelPL');
    const panelTotal = el('panelTotal');
    const inputPanjang = el('inputPanjang');
    const inputLebar = el('inputLebar');
    const inputTotalLuas = el('inputTotalLuas');

    quickBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        quickBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const areaAttr = btn.getAttribute('data-area');
        if (areaAttr === 'custom') {
          state.areaMode = 'custom';
          if (customBox) customBox.style.display = 'block';
          updateCustomArea();
        } else {
          state.areaMode = 'quick';
          if (customBox) customBox.style.display = 'none';
          state.quickAreaVal = parseFloat(areaAttr) || 1000;
          state.activeArea = state.quickAreaVal;
          state.descArea = `Pilihan cepat luas wilayah ${formatIDRNumber(state.activeArea)} m²`;
          recalculateAll();
        }
      });
    });

    if (tabPL && tabTotal) {
      tabPL.addEventListener('click', () => {
        state.customSubMode = 'pl';
        tabPL.classList.add('active');
        tabTotal.classList.remove('active');
        if (panelPL) panelPL.classList.remove('hidden');
        if (panelTotal) panelTotal.classList.add('hidden');
        updateCustomArea();
      });

      tabTotal.addEventListener('click', () => {
        state.customSubMode = 'total';
        tabTotal.classList.add('active');
        tabPL.classList.remove('active');
        if (panelTotal) panelTotal.classList.remove('hidden');
        if (panelPL) panelPL.classList.add('hidden');
        updateCustomArea();
      });
    }

    if (inputPanjang) {
      inputPanjang.addEventListener('input', (e) => {
        state.panjang = Math.max(1, parseFloat(e.target.value) || 0);
        if (state.areaMode === 'custom' && state.customSubMode === 'pl') {
          updateCustomArea();
        }
      });
    }

    if (inputLebar) {
      inputLebar.addEventListener('input', (e) => {
        state.lebar = Math.max(1, parseFloat(e.target.value) || 0);
        if (state.areaMode === 'custom' && state.customSubMode === 'pl') {
          updateCustomArea();
        }
      });
    }

    if (inputTotalLuas) {
      inputTotalLuas.addEventListener('input', (e) => {
        state.totalLuasCustom = Math.max(1, parseFloat(e.target.value) || 0);
        if (state.areaMode === 'custom' && state.customSubMode === 'total') {
          updateCustomArea();
        }
      });
    }

    function updateCustomArea() {
      if (state.customSubMode === 'pl') {
        state.activeArea = Math.round(state.panjang * state.lebar);
        state.descArea = `Ukuran lapangan: ${state.panjang} m × ${state.lebar} m = ${formatIDRNumber(state.activeArea)} m²`;
      } else {
        state.activeArea = Math.round(state.totalLuasCustom);
        state.descArea = `Total luas wilayah dimasukkan manual: ${formatIDRNumber(state.activeArea)} m²`;
      }
      recalculateAll();
    }

    // Pilihan Kepadatan (D)
    const groupDensity = el('groupDensity');
    if (groupDensity) {
      const cards = groupDensity.querySelectorAll('.select-card');
      cards.forEach((card) => {
        card.addEventListener('click', () => {
          cards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          state.density = parseFloat(card.getAttribute('data-val')) || 1.0;
          const titleEl = card.querySelector('.select-title');
          const noteEl = card.querySelector('.select-note');
          state.densityTitle = titleEl ? titleEl.textContent.trim() : `${state.density} org/m²`;
          state.densityDesc = noteEl ? noteEl.textContent.trim() : '';
          recalculateAll();
        });
      });
    }
  }

  // --- MODUL 2: INDOOR (JENIS KEGIATAN & JUMLAH PESERTA) ---
  function bindIndoorControls() {
    const groupType = el('groupIndoorType');
    const customBox = el('customIndoorTypeBox');
    const inputCustomName = el('inputIndoorCustomName');
    const quickCountBtns = document.querySelectorAll('#quickIndoorCountGroup .quick-btn');
    const inputIndoorCount = el('inputIndoorCount');
    const btnMinus = el('btnIndoorMinus');
    const btnPlus = el('btnIndoorPlus');

    if (groupType) {
      const cards = groupType.querySelectorAll('.select-card');
      cards.forEach((card) => {
        card.addEventListener('click', () => {
          cards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');

          const typeVal = card.getAttribute('data-type') || 'Pelatihan';
          state.indoorTypeMode = typeVal;
          const noteEl = card.querySelector('.select-note');
          state.indoorCategoryNote = noteEl ? noteEl.textContent.trim() : '';

          if (typeVal === 'custom') {
            if (customBox) customBox.classList.remove('hidden');
          } else {
            if (customBox) customBox.classList.add('hidden');
          }
          recalculateAll();
        });
      });
    }

    if (inputCustomName) {
      inputCustomName.addEventListener('input', (e) => {
        state.indoorCustomName = e.target.value;
        recalculateAll();
      });
    }

    quickCountBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        quickCountBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const val = parseInt(btn.getAttribute('data-count'), 10) || 0;
        state.indoorCount = val;
        if (inputIndoorCount) inputIndoorCount.value = val;
        recalculateAll();
      });
    } );

    if (inputIndoorCount) {
      inputIndoorCount.addEventListener('input', (e) => {
        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
        state.indoorCount = val;
        syncQuickIndoorButtons(val);
        recalculateAll();
      });
    }

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        state.indoorCount = Math.max(0, state.indoorCount - 5);
        if (inputIndoorCount) inputIndoorCount.value = state.indoorCount;
        syncQuickIndoorButtons(state.indoorCount);
        recalculateAll();
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        state.indoorCount = state.indoorCount + 5;
        if (inputIndoorCount) inputIndoorCount.value = state.indoorCount;
        syncQuickIndoorButtons(state.indoorCount);
        recalculateAll();
      });
    }

    function syncQuickIndoorButtons(val) {
      quickCountBtns.forEach((b) => {
        const btnVal = parseInt(b.getAttribute('data-count'), 10);
        b.classList.toggle('active', btnVal === val);
      });
    }
  }

  // --- MODUL 3: HITUNG SENIMAN (CLUSTERING) ---
  function bindSenimanControls() {
    const inputUtama = el('inputSenimanUtama');
    const inputPendukung = el('inputSenimanPendukung');
    const inputPemusik = el('inputSenimanPemusik');
    const stepBtns = document.querySelectorAll('.mini-step-btn');

    function syncFromInputs() {
      state.senimanUtama = Math.max(0, parseInt(inputUtama ? inputUtama.value : 0, 10) || 0);
      state.senimanPendukung = Math.max(0, parseInt(inputPendukung ? inputPendukung.value : 0, 10) || 0);
      state.senimanPemusik = Math.max(0, parseInt(inputPemusik ? inputPemusik.value : 0, 10) || 0);
      recalculateAll();
    }

    if (inputUtama) inputUtama.addEventListener('input', syncFromInputs);
    if (inputPendukung) inputPendukung.addEventListener('input', syncFromInputs);
    if (inputPemusik) inputPemusik.addEventListener('input', syncFromInputs);

    stepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const delta = parseInt(btn.getAttribute('data-delta'), 10) || 0;
        const targetInput = el(targetId);
        if (targetInput) {
          const current = parseInt(targetInput.value, 10) || 0;
          const next = Math.max(0, current + delta);
          targetInput.value = next;
          syncFromInputs();
        }
      });
    });
  }

  // --- KALKULASI TIAP MODUL SECARA TERPISAH (BERDIRI SENDIRI) ---
  function recalculateAll() {
    // 1. Hitung Modul 1: Outdoor (Jacobs: P = A x D)
    const A = Math.max(1, state.activeArea || 0);
    const D = state.density;
    state.totalOutdoor = Math.round(A * D);

    const strA = formatIDRNumber(A);
    const strD = D.toString().replace('.', ',');
    const strTotalOutdoor = formatIDRNumber(state.totalOutdoor);

    setElText('badgeLuas', `${strA} m²`);
    setElText('pillTotalOutdoor', `${strTotalOutdoor} org`);

    // 2. Hitung Modul 2: Indoor
    const indoorName = getActiveIndoorName();
    const strTotalIndoor = formatIDRNumber(state.indoorCount);
    setElText('lblJenisIndoorAktif', `(${indoorName})`);
    setElText('pillTotalIndoor', `${strTotalIndoor} org`);

    // 3. Hitung Modul 3: Seniman (Clustering: Utama + Pendukung + Pemusik)
    state.totalSeniman = state.senimanUtama + state.senimanPendukung + state.senimanPemusik;
    const strTotalSeniman = formatIDRNumber(state.totalSeniman);
    setElText(
      'badgeRincianSeniman',
      `${formatIDRNumber(state.senimanUtama)} Utama + ${formatIDRNumber(state.senimanPendukung)} Pendukung + ${formatIDRNumber(state.senimanPemusik)} Pemusik`
    );
    setElText('pillTotalSeniman', `${strTotalSeniman} org`);

    // 4. Update Kartu Hasil Utama di Bawah (Masing-Masing Modul Berdiri Sendiri)
    if (state.activeModule === 'outdoor') {
      setElText('txtResultHeader', 'ESTIMASI PENONTON OUTDOOR (P)');
      setElText('txtTotalResult', strTotalOutdoor);
      setElText('txtResultUnit', 'ORANG / JIWA');
      setElText('txtProofLabel', 'Rumus Metode Jacobs: P = A × D');
      setElText('txtFormulaProof', `${strA} m² × ${strD} = ${strTotalOutdoor} orang`);
    } else if (state.activeModule === 'indoor') {
      setElText('txtResultHeader', `TOTAL PESERTA INDOOR (${indoorName.toUpperCase()})`);
      setElText('txtTotalResult', strTotalIndoor);
      setElText('txtResultUnit', 'ORANG / PESERTA');
      setElText('txtProofLabel', 'Kategori Kegiatan Ruangan (Indoor)');
      setElText('txtFormulaProof', `Kegiatan ${indoorName} = ${strTotalIndoor} orang`);
    } else if (state.activeModule === 'seniman') {
      setElText('txtResultHeader', 'TOTAL JUMLAH SENIMAN (CLUSTERING)');
      setElText('txtTotalResult', strTotalSeniman);
      setElText('txtResultUnit', 'ORANG / SENIMAN');
      setElText('txtProofLabel', 'Rumus Kategori Peran: Utama + Pendukung + Pemusik');
      setElText(
        'txtFormulaProof',
        `${formatIDRNumber(state.senimanUtama)} Utama + ${formatIDRNumber(state.senimanPendukung)} Pendukung + ${formatIDRNumber(state.senimanPemusik)} Pemusik = ${strTotalSeniman} orang`
      );
    }
  }

  // --- TOMBOL AKSI: SALIN WHATSAPP & CETAK PDF (SESUAI MODUL AKTIF) ---
  function bindActionButtons() {
    const btnWA = el('btnSalinWA');
    const btnPDF = el('btnCetakPDF');

    if (btnWA) {
      btnWA.addEventListener('click', copyWhatsAppSummary);
    }

    if (btnPDF) {
      btnPDF.addEventListener('click', prepareAndPrintPDF);
    }
  }

  function copyWhatsAppSummary() {
    const strTgl = formatTanggalID(state.tglAcara);
    let waText = '';

    if (state.activeModule === 'outdoor') {
      const strA = formatIDRNumber(state.activeArea);
      const strD = state.density.toString().replace('.', ',');
      const strOut = formatIDRNumber(state.totalOutdoor);

      waText =
`*ESTIMASI PENONTON OUTDOOR ACARA BUDAYA*
🏛️ *TAKAR BUDAYA* (Metode Herbert Jacobs)
---------------------------------------------
🎪 *Nama Acara:* ${state.namaAcara}
📅 *Tanggal:* ${strTgl}
⏰ *Waktu:* ${state.jamAcara}

📊 *Rincian Parameter Outdoor:*
1. Luas Area (A) : ${strA} m²
2. Kepadatan (D) : ${strD} orang/m² (${state.densityTitle})

🧮 *Perhitungan Rumus (P = A × D):*
${strA} m² × ${strD} = *${strOut} Orang*

🎯 *TOTAL ESTIMASI PENONTON OUTDOOR:*
👉 *${strOut} ORANG / JIWA*
---------------------------------------------
_Dihitung melalui instrumen bantu Takar Budaya._`;
    } else if (state.activeModule === 'indoor') {
      const indoorName = getActiveIndoorName();
      const strIn = formatIDRNumber(state.indoorCount);

      waText =
`*DATA PESERTA KEGIATAN INDOOR BUDAYA*
🏛️ *TAKAR BUDAYA* (Modul Indoor / Ruangan)
---------------------------------------------
🎪 *Nama Acara:* ${state.namaAcara}
📅 *Tanggal:* ${strTgl}
⏰ *Waktu:* ${state.jamAcara}

📊 *Rincian Kegiatan Indoor:*
• Jenis Kegiatan : ${indoorName}
• Keterangan     : ${state.indoorCategoryNote}

🎯 *TOTAL PESERTA INDOOR (${indoorName.toUpperCase()}):*
👉 *${strIn} ORANG / PESERTA*
---------------------------------------------
_Dihitung melalui instrumen bantu Takar Budaya._`;
    } else if (state.activeModule === 'seniman') {
      const strUtama = formatIDRNumber(state.senimanUtama);
      const strPendukung = formatIDRNumber(state.senimanPendukung);
      const strPemusik = formatIDRNumber(state.senimanPemusik);
      const strSen = formatIDRNumber(state.totalSeniman);

      waText =
`*DATA JUMLAH SENIMAN / PELAKU BUDAYA*
🏛️ *TAKAR BUDAYA* (Teknik Kategori Peran / Clustering)
---------------------------------------------
🎪 *Nama Acara:* ${state.namaAcara}
📅 *Tanggal:* ${strTgl}
⏰ *Waktu:* ${state.jamAcara}

🎭 *Rincian Kategori Peran Seniman:*
1. Pemeran Utama    : ${strUtama} Orang
2. Pemain Pendukung : ${strPendukung} Orang
3. Pemusik          : ${strPemusik} Orang

🧮 *Perhitungan Clustering:*
${strUtama} Utama + ${strPendukung} Pendukung + ${strPemusik} Pemusik = *${strSen} Orang*

🎯 *TOTAL JUMLAH SENIMAN:*
👉 *${strSen} ORANG / SENIMAN*
---------------------------------------------
_Dihitung melalui instrumen bantu Takar Budaya._`;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(waText).then(() => {
        showToast();
      }).catch(() => {
        fallbackCopyText(waText);
      });
    } else {
      fallbackCopyText(waText);
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast();
    } catch (err) {
      alert('Gagal menyalin pesan otomatis. Silakan salin manual.');
    }
    document.body.removeChild(textarea);
  }

  function showToast() {
    const toast = el('toastCopy');
    if (!toast) return;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // --- CETAK PDF LAPORAN A4 (SESUAI MODUL AKTIF, BERDIRI SENDIRI) ---
  function prepareAndPrintPDF() {
    setElText('pdfNamaAcara', state.namaAcara);
    setElText('pdfTglAcara', formatTanggalID(state.tglAcara));
    setElText('pdfJamAcara', state.jamAcara);

    const now = new Date();
    const printTimeStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' pukul ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setElText('pdfWaktuCetak', printTimeStr);

    const container = el('pdfDynamicContent');
    if (!container) return;

    let html = '';

    if (state.activeModule === 'outdoor') {
      setElText('pdfMetaMethod', 'Modul Outdoor • Metode Ilmiah: Herbert Jacobs (1967) • Rumus: P = A × D');
      const strA = formatIDRNumber(state.activeArea);
      const strD = state.density.toString().replace('.', ',');
      const strOut = formatIDRNumber(state.totalOutdoor);

      html = `
        <div class="pdf-section-title">I. RINCIAN PARAMETER LAPANGAN (MODUL OUTDOOR)</div>
        <table class="pdf-table-data">
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">No</th>
              <th style="width: 32%;">Parameter Penghitungan</th>
              <th style="width: 12%; text-align: center;">Simbol</th>
              <th style="width: 20%; text-align: right;">Nilai Terukur</th>
              <th style="width: 30%;">Keterangan Lapangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td><strong>Luas Area Efektif</strong></td>
              <td style="text-align: center;"><code>A</code></td>
              <td style="text-align: right; font-weight: bold;">${strA} m&sup2;</td>
              <td>${state.descArea}</td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td><strong>Kepadatan Penonton</strong></td>
              <td style="text-align: center;"><code>D</code></td>
              <td style="text-align: right; font-weight: bold;">${strD} org/m&sup2;</td>
              <td>${state.densityTitle} &mdash; ${state.densityDesc}</td>
            </tr>
          </tbody>
        </table>
        <div class="pdf-section-title">II. HASIL KALKULASI ESTIMASI PENONTON OUTDOOR</div>
        <div class="pdf-result-card">
          <div class="pdf-calc-line">
            <strong>Pembuktian Rumus Jacobs (P = A &times; D):</strong><br>
            <span>${strA} m&sup2; &times; ${strD} = ${strOut} Orang</span>
          </div>
          <div class="pdf-banner-total">
            <span>TOTAL ESTIMASI PENONTON OUTDOOR:</span>
            <strong>${strOut} ORANG / JIWA</strong>
          </div>
        </div>
      `;
    } else if (state.activeModule === 'indoor') {
      const indoorName = getActiveIndoorName();
      const strIn = formatIDRNumber(state.indoorCount);
      setElText('pdfMetaMethod', `Modul Indoor (Kegiatan Ruangan) • Kategori: ${indoorName}`);

      html = `
        <div class="pdf-section-title">I. RINCIAN PARTISIPASI KEGIATAN INDOOR (RUANGAN)</div>
        <table class="pdf-table-data">
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">No</th>
              <th style="width: 34%;">Kategori Kegiatan Indoor</th>
              <th style="width: 22%; text-align: right;">Jumlah Peserta</th>
              <th style="width: 38%;">Keterangan Kegiatan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td><strong>${indoorName}</strong></td>
              <td style="text-align: right; font-weight: bold;">${strIn} Orang</td>
              <td>${state.indoorCategoryNote}</td>
            </tr>
          </tbody>
        </table>
        <div class="pdf-section-title">II. HASIL TOTAL PESERTA INDOOR</div>
        <div class="pdf-result-card">
          <div class="pdf-banner-total" style="border-top: none; padding-top: 0;">
            <span>TOTAL PESERTA KEGIATAN INDOOR (${indoorName.toUpperCase()}):</span>
            <strong>${strIn} ORANG / PESERTA</strong>
          </div>
        </div>
      `;
    } else if (state.activeModule === 'seniman') {
      setElText('pdfMetaMethod', 'Modul Hitung Seniman • Teknik Kategori Peran (Clustering)');
      const strUtama = formatIDRNumber(state.senimanUtama);
      const strPendukung = formatIDRNumber(state.senimanPendukung);
      const strPemusik = formatIDRNumber(state.senimanPemusik);
      const strSen = formatIDRNumber(state.totalSeniman);

      html = `
        <div class="pdf-section-title">I. RINCIAN KATEGORI PERAN SENIMAN / PELAKU BUDAYA (CLUSTERING)</div>
        <table class="pdf-table-data">
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">No</th>
              <th style="width: 34%;">Kategori Peran Seniman</th>
              <th style="width: 20%; text-align: right;">Jumlah Pelaku</th>
              <th style="width: 40%;">Rincian Peran</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td><strong>Pemeran Utama</strong></td>
              <td style="text-align: right; font-weight: bold;">${strUtama} Orang</td>
              <td>Pemain utama, penyanyi, penari inti, dalang, dll.</td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td><strong>Pemain Pendukung</strong></td>
              <td style="text-align: right; font-weight: bold;">${strPendukung} Orang</td>
              <td>Penari latar, paduan suara, pemain figuran, dll.</td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td><strong>Pemusik</strong></td>
              <td style="text-align: right; font-weight: bold;">${strPemusik} Orang</td>
              <td>Pengiring musik di panggung (gamelan, band, dll.)</td>
            </tr>
          </tbody>
        </table>
        <div class="pdf-section-title">II. HASIL KALKULASI JUMLAH SENIMAN</div>
        <div class="pdf-result-card">
          <div class="pdf-calc-line">
            <strong>Penjumlahan Kategori Peran (Clustering):</strong><br>
            <span>${strUtama} Pemeran Utama + ${strPendukung} Pemain Pendukung + ${strPemusik} Pemusik = ${strSen} Orang</span>
          </div>
          <div class="pdf-banner-total">
            <span>TOTAL PELAKU / SENIMAN TERLIBAT:</span>
            <strong>${strSen} ORANG / SENIMAN</strong>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    setTimeout(() => {
      window.print();
    }, 150);
  }

  // Mulai saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
