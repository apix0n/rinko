let apiToken = '';

function authenticate() {
	apiToken = document.getElementById('apiToken').value.trim();
	if (!apiToken) {
		alert('Please enter an API token');
		return;
	}

	fetchLinks();
}

function setupCheckboxListeners() {
	const checkboxes = document.querySelectorAll('#linksTableBody input[type="checkbox"]');
	checkboxes.forEach(checkbox => {
		checkbox.addEventListener('change', updateButtonVisibility);
	});
}

function updateButtonVisibility() {
	const anyChecked = document.querySelectorAll('#linksTableBody input[type="checkbox"]:checked').length > 0;
	document.getElementById('addLinkButton').classList.toggle('hidden', anyChecked);
	document.getElementById('massImportButton').classList.toggle('hidden', anyChecked);
	document.getElementById('unselectAllButton').classList.toggle('hidden', !anyChecked);
	document.getElementById('deleteSelectedButton').classList.toggle('hidden', !anyChecked);
}

function unselectAll() {
	document.querySelectorAll('#linksTableBody input[type="checkbox"]:checked').forEach(checkbox => {
		checkbox.checked = false;
	});
	updateButtonVisibility();
}

function fetchLinks() {
	fetch('/_/list', {
		headers: {
			'Authorization': `Bearer ${apiToken}`
		}
	})
		.then(response => {
			if (!response.ok) {
				throw new Error('Authentication failed');
			}
			return response.json();
		})
		.then(data => {
			// Show admin panel
			document.querySelector('.center-container > div > p').textContent = `manage ${data.length} links for ${new Set(data.filter(item => !item.url.startsWith("/") || item.url.startsWith('/_')).map(item => item.url)).size} destinations`
			document.getElementById('authSection').classList.add('hidden');
			document.getElementById('adminPanel').classList.remove('hidden');

			// Populate table
			const tableBody = document.getElementById('linksTableBody');
			tableBody.innerHTML = '';

			data.forEach(link => {
				const row = document.createElement('tr');
				row.innerHTML = `
                        <td><input type="checkbox" id="select-${link.slug}"></td>
                        <td data-slug=${link.slug}><a href="${link.link}" target="_blank">${link.slug}</a></td>
                        <td><a href="${link.url}" target="_blank">${link.url}</a></td>
                        <td>
                            <div class="actions">
                                <button onclick="editLink('${link.slug}'); document.getElementById('newSlug').focus();">edit</button>
                                <button onclick="deleteLink('${link.slug}')" style="background-color: #f44336;">delete</button>
                            </div>
                        </td>
                    `;
				tableBody.appendChild(row);
			});

			setupCheckboxListeners();
			updateButtonVisibility();
			document.getElementById('searchInput').value = '';
			filterLinks();
		})
		.catch(error => {
			alert('Error: ' + error.message);
			document.getElementById('apiToken').value = '';
		});
}

function showAddForm() {
	document.getElementById('formTitle').textContent = 'add new link';
	document.getElementById('formSubmitButton').textContent = 'add link';
	document.getElementById('editMode').value = 'false';
	document.getElementById('originalSlug').value = '';
	document.getElementById('newSlug').value = '';
	document.getElementById('newUrl').value = '';
	document.getElementById('addLinkForm').classList.remove('hidden');
}

function showEditForm(slug, url) {
	document.getElementById('formTitle').textContent = 'edit link';
	document.getElementById('formSubmitButton').textContent = 'update link';
	document.getElementById('editMode').value = 'true';
	document.getElementById('originalSlug').value = slug;
	document.getElementById('newSlug').value = slug;
	document.getElementById('newUrl').value = url;
	document.getElementById('addLinkForm').classList.remove('hidden');
}

function hideAddForm() {
	document.getElementById('addLinkForm').classList.add('hidden');
	document.getElementById('newSlug').value = '';
	document.getElementById('newUrl').value = '';
}

function submitLinkForm() {
	const isEditMode = document.getElementById('editMode').value === 'true';
	const originalSlug = document.getElementById('originalSlug').value;
	const slug = document.getElementById('newSlug').value.trim();
	const url = document.getElementById('newUrl').value.trim();

	if (!url) {
		alert('Please enter a URL');
		return;
	}

	const payload = { url, overwrite: true };
	if (slug) payload.slug = slug;

	if (isEditMode && slug !== originalSlug) {
		// First, try to create/update the new link
		fetch('/_/set', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})
			.then(async response => {
				if (!response.ok) {
					let msg = 'Failed to update link';
					try {
						const data = await response.json();
						msg = data.message || msg;
					} catch { }
					throw new Error(msg);
				}
				// Only after success, delete the old link
				return fetch('/_/set', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${apiToken}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ slug: originalSlug, overwrite: true })
				});
			})
			.then(async response => {
				if (!response.ok) {
					let msg = 'Failed to delete old link';
					try {
						const data = await response.json();
						msg = data.message || msg;
					} catch { }
					throw new Error(msg);
				}
				alert('Link updated successfully');
				hideAddForm();
				fetchLinks();
			})
			.catch(error => {
				alert('Error: ' + (error.message || 'Failed to update link'));
			});
	} else {
		// Normal add or update
		fetch('/_/set', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})
			.then(async response => {
				if (!response.ok) {
					let msg = `Failed to ${isEditMode ? 'update' : 'add'} link`;
					try {
						const data = await response.json();
						msg = data.message || msg;
					} catch { }
					throw new Error(msg);
				}
				alert(`Link ${isEditMode ? 'updated' : 'added'} successfully`);
				hideAddForm();
				fetchLinks();
			})
			.catch(error => {
				alert('Error: ' + (error.message || `Failed to ${isEditMode ? 'update' : 'add'} link`));
			});
	}
}

function editLink(slug) {
	// Find the URL for this slug in the table
	const row = document.querySelector(`#linksTableBody tr td:nth-child(2)[data-slug="${slug}"]`)?.closest('tr');
	if (!row) {
		alert('Could not find link to edit');
		return;
	}

	const url = row.querySelector('td:nth-child(3) a').textContent;
	showEditForm(slug, url);
}

function deleteLink(slug) {
	if (confirm(`Are you sure you want to delete ${slug}?`)) {
		fetch('/_/set', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ slug, overwrite: true })
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Failed to delete link');
				}
				fetchLinks();
			})
			.catch(error => {
				alert('Error: ' + error.message);
			});
	}
}

function deleteSelected() {
	const checkboxes = document.querySelectorAll('#linksTableBody input[type="checkbox"]:checked');
	if (checkboxes.length === 0) {
		alert('Please select at least one link to delete');
		return;
	}

	const slugs = Array.from(checkboxes).map(cb => {
		return cb.id.replace('select-', '');
	});

	if (!confirm(`Are you sure you want to delete ${slugs.length} selected links?`)) {
		return;
	}

	// Create an array of delete promises
	const deletePromises = slugs.map(slug => {
		return fetch('/_/set', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ slug, overwrite: true })
		});
	});

	Promise.all(deletePromises)
		.then(() => {
			fetchLinks();
		})
		.catch(error => {
			alert('Error deleting some links: ' + error.message);
			fetchLinks(); // Refresh anyway to show current state
		});
}

document.getElementById('formSubmitButton').addEventListener('click', submitLinkForm);

document.getElementById('apiToken').addEventListener('keydown', function (e) {
	if (e.key === 'Enter') {
		authenticate();
	}
});

document.getElementById('newSlug').addEventListener('keydown', function (e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		document.getElementById('newUrl').focus();
	}
});
document.getElementById('newUrl').addEventListener('keydown', function (e) {
	if (e.key === 'Enter') {
		submitLinkForm();
	}
});

// Mass Import Functions
function showMassImport() {
	document.getElementById('massImportInput').value = '';
	document.getElementById('massImportForm').classList.remove('hidden');
}

function hideMassImport() {
	document.getElementById('massImportForm').classList.add('hidden');
}

async function processMassImport() {
	const input = document.getElementById('massImportInput').value.trim();
	if (!input) {
		alert('Please enter links to import');
		return;
	}

	const lines = input.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#')); // Ignore empty lines and comments

	if (lines.length === 0) {
		alert('No valid links found (comments were ignored)');
		return;
	}

	const results = [];

	for (const line of lines) {
		const [slug, url] = line.split(/\s+/).filter(Boolean); // Split on whitespace + remove empty
		if (!slug || !url) {
			results.push(`skipped: "${line}" (invalid format)`);
			continue;
		}

		try {
			const response = await fetch('/_/set', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					slug: slug.replace(/^\//, ''), // Remove leading slash
					url: url,
					overwrite: true
				})
			});

			if (response.ok) {
				results.push(`✅ added: ${slug} → ${url}`);
			} else {
				const error = await response.json();
				results.push(`❌ failed: ${slug} (${error.message || 'server error'})`);
			}
		} catch (err) {
			results.push(`❌ Error: ${slug} (${err.message})`);
		}
	}

	alert(results.join('\n'));
	hideMassImport();
	fetchLinks(); // Refresh the list
}

function filterLinks() {
	const searchTerm = document.getElementById('searchInput').value.toLowerCase();
	const rows = document.querySelectorAll('#linksTableBody tr');

	rows.forEach(row => {
		const slug = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
		const url = row.querySelector('td:nth-child(3) a').textContent.toLowerCase();
		const shouldShow = slug.includes(searchTerm) || url.includes(searchTerm);
		row.style.display = shouldShow ? '' : 'none';
	});
}