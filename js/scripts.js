// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  const openModalButton = document.getElementById('openModal');
  const closeModalButton = document.getElementById('closeModal');
  const modal = document.getElementById('modal');
  const steps = document.querySelectorAll('.step');
  const toStep2Button = document.getElementById('toStep2');
  const toStep3Button = document.getElementById('toStep3');
  const submitButton = document.getElementById('submit');
  const zipFileInput = document.getElementById('zipFile');
  const previewIframe = document.getElementById('preview');

  let currentStep = 0;
  let fileMap = {};

  openModalButton.addEventListener('click', () => {
      modal.style.display = 'block';
  });

  closeModalButton.addEventListener('click', () => {
      modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
      if (event.target === modal) {
          modal.style.display = 'none';
      }
  });

  function showStep(stepIndex) {
      steps.forEach((step, index) => {
          step.style.display = index === stepIndex ? 'block' : 'none';
      });
  }

  toStep2Button.addEventListener('click', () => {
      currentStep = 1;
      showStep(currentStep);
  });

  toStep3Button.addEventListener('click', () => {
      currentStep = 2;
      showStep(currentStep);
  });

  submitButton.addEventListener('click', () => {
      alert('Files Submitted!');
      modal.style.display = 'none';
  });

  zipFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file && file.name.endsWith('.zip')) {
          const zip = new JSZip();
          zip.loadAsync(file)
              .then((zipContent) => {
                  fileMap = {};
                  const promises = [];

                  zipContent.forEach((relativePath, zipEntry) => {
                      if (!zipEntry.dir) {
                          promises.push(zipEntry.async('blob').then((content) => {
                              const url = URL.createObjectURL(content);
                              fileMap[relativePath] = url;
                          }));
                      }
                  });

                  Promise.all(promises).then(() => {
                      if (fileMap['index.html']) {
                          const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
                          iframeDoc.open();
                          iframeDoc.write('<!DOCTYPE html><html><head><base href="/" /></head><body></body></html>');
                          iframeDoc.close();

                          const base = iframeDoc.createElement('base');
                          base.href = fileMap['index.html'];
                          iframeDoc.head.appendChild(base);

                          Object.keys(fileMap).forEach((path) => {
                              if (path.endsWith('.css')) {
                                  const link = iframeDoc.createElement('link');
                                  link.rel = 'stylesheet';
                                  link.href = fileMap[path];
                                  iframeDoc.head.appendChild(link);
                              } else if (path.endsWith('.js')) {
                                  const script = iframeDoc.createElement('script');
                                  script.src = fileMap[path];
                                  iframeDoc.body.appendChild(script);
                              }
                          });

                          fetch(fileMap['index.html']).then(response => response.text()).then(html => {
                              iframeDoc.body.innerHTML = html;
                          });
                      } else {
                          alert('index.html file not found in the zip.');
                      }
                  });
              })
              .catch((error) => {
                  console.error('Error reading zip file:', error);
                  alert('Failed to read zip file');
              });
      } else {
          alert('Please upload a valid zip file.');
      }
  });

  showStep(currentStep);
});
