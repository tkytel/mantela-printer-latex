function
escapeLaTeX(s)
{
	const convTab = [
		{ from: '#', to: '\\#' },
		{ from: '$', to: '\\$' },
		{ from: '%', to: '\\%' },
		{ from: '&', to: '\\&' },
		{ from: '_', to: '\\_' },
		{ from: '{', to: '\\{' },
		{ from: '}', to: '\\}' },
	];

	s = s || '';
	convTab.forEach(v => {
		s = s.replaceAll(v.from, v.to);
		console.log(s);
	});

	return s;
}

function
generateLaTeX(mantelas, options = { })
{
	const opt = {
		classOptions: [
			'lualatex',
		],
		documentClass: 'jlreq',
		title: 'Telephone Numbers',
		author: 'Tokyo Wide Area Telephony Network',
		date: (new Date()).toLocaleString(),
		packages: [
			{ options: [], package: 'newtx' },
		],
		preamble: [
			'\\setcounter{secnumdepth}{0}',
		]
	};
	Object.assign(opt, options);

	const s = [];
	s.push(`\\documentclass[${opt.classOptions.join(',')}]{${opt.documentClass}}`);
	s.push(`\\title{${opt.title}}`);
	s.push(`\\author{${opt.author}}`);
	s.push(`\\date{${opt.date}}`);
	opt.packages.forEach(e => {
		s.push(`\\usepackage${e.options.length ? `[${e.options.join(',')}]` : ''}`
			+ `{${e.package}}`);
	});
	opt.preamble.forEach(e => {
		s.push(e);
	});

	s.push(`\\begin{document}`);
	s.push(`\\maketitle`);

	s.push(`\\section{Note}`);
	s.push('This directory may not reflect the most up-to-date information.');

	mantelas.forEach(e => {
		const v = e.mantela;

		s.push(`\\section{${escapeLaTeX(v.aboutMe.name)}`);
		s.push(`{\\small\\ttfamily ${escapeLaTeX(v.aboutMe.identifier)}}}`);
		s.push(`\\begin{itemize}`);
		v.extensions.forEach(e => {
			s.push(`\\item ${e.extension}, ${escapeLaTeX(e.name)}, ${e.type}`);
		});
		s.push(`\\end{itemize}`);
	});
	s.push(`\\end{document}`);

	return s.join('\n');
}

function
downloadTextFile(content, filename)
{
	const blob = new Blob([ content ], { type: 'text/x-tex' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	a.remove();

	URL.revokeObjectURL(url);
}

formMantela.addEventListener('submit', async e => {
	e.preventDefault();
	btnGenerate.disabled = true;
	const start = performance.now();
	outputStatus.textContent = '';
	const { mantelas, errors } = await fetchMantelas3(urlMantela.value, {
		maxDepth: checkNest.checked ? +numNest.value : Infinity,
	});
	const stop = performance.now();
	outputStatus.textContent = `Done. (${stop - start} ms)`;
	btnGenerate.disabled = false;

	const cloneError = outputError.cloneNode(false);
	outputError.parentNode.replaceChild(cloneError, outputError);
	errors.forEach(e => {
		const dt = document.createElement('dt');
		dt.textContent = e.message;

		const ddNameMesg = document.createElement('dd');
		ddNameMesg.textContent = {
			TypeError: /* may be thrown by fetch() */
				'Mantela.json の取得に失敗した可能性があります'
				+ '（CORS の設定や HTTP ヘッダを確認してみてください）',
			Error: /* may be thrown if status code is not OK */
				'Mantela.json の取得に失敗した可能性があります'
				+ '（正しい URL であるか確認してみてください）',
			SyntaxError: /* may be thrown by res.json() */
				'Mantela.json の解釈に失敗した可能性があります'
				+ '（書式に問題がないか確認してみてください）',
		}[e.cause.name] || '不明なエラーです';

		const ddCause = document.createElement('dd');
		ddCause.textContent = String(e.cause);

		cloneError.append(dt, ddNameMesg, ddCause);
	});
	summaryError.textContent = `エラー情報（${errors.length} 件）`;

	const latex = generateLaTeX(mantelas);

	downloadTextFile(latex, 'book.tex');
});


/*
 * first のパラメータが指定されているときは自動入力して表示する
 */
const urlSearch = new URLSearchParams(document.location.search);
if (urlSearch.get('first')) {
	urlMantela.value = urlSearch.get('first');
	btnGenerate.click();
}
