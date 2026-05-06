import PDFDocument from 'pdfkit';

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('es-ES') : '—';

const drawLine = (doc) => {
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc').moveDown(0.5);
};

const sectionTitle = (doc, text) => {
  doc.moveDown(0.5)
    .fontSize(11)
    .fillColor('#333333')
    .font('Helvetica-Bold')
    .text(text.toUpperCase())
    .moveDown(0.3);
  drawLine(doc);
  doc.font('Helvetica').fontSize(10).fillColor('#000000');
};

const field = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
    .font('Helvetica').text(value || '—');
};

const addressText = (addr) => {
  if (!addr) return '—';
  const { street, number, postal, city, province } = addr;
  return [street, number, postal, city, province].filter(Boolean).join(', ') || '—';
};

export const generateDeliveryNotePdf = (deliveryNote, signatureBuffer = null) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { user, client, project, company } = deliveryNote;

    // Cabecera
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text('ALBARÁN', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#555555')
      .text(`Fecha de trabajo: ${formatDate(deliveryNote.workDate)}`, { align: 'center' })
      .text(`Formato: ${deliveryNote.format === 'hours' ? 'Horas' : 'Material'}`, { align: 'center' });

    doc.moveDown(1);
    drawLine(doc);

    // Empresa
    sectionTitle(doc, 'Empresa');
    field(doc, 'Nombre', company?.name);
    field(doc, 'CIF', company?.cif);
    field(doc, 'Dirección', addressText(company?.address));

    // Usuario
    sectionTitle(doc, 'Responsable');
    field(doc, 'Nombre', `${user?.name || ''} ${user?.lastName || ''}`.trim());
    field(doc, 'Email', user?.email);

    // Cliente
    sectionTitle(doc, 'Cliente');
    field(doc, 'Nombre', client?.name);
    field(doc, 'CIF', client?.cif);
    field(doc, 'Email', client?.email);
    field(doc, 'Dirección', addressText(client?.address));

    // Proyecto
    sectionTitle(doc, 'Proyecto');
    field(doc, 'Nombre', project?.name);
    field(doc, 'Código', project?.projectCode);
    field(doc, 'Dirección', addressText(project?.address));
    if (project?.notes) field(doc, 'Notas', project.notes);

    // Detalles del albarán
    sectionTitle(doc, 'Detalles');
    if (deliveryNote.description) field(doc, 'Descripción', deliveryNote.description);

    if (deliveryNote.format === 'material') {
      field(doc, 'Material', deliveryNote.material);
      field(doc, 'Cantidad', `${deliveryNote.quantity} ${deliveryNote.unit}`);
    } else {
      if (deliveryNote.hours) {
        field(doc, 'Horas totales', `${deliveryNote.hours}h`);
      }
      if (deliveryNote.workers?.length) {
        doc.moveDown(0.3).font('Helvetica-Bold').text('Trabajadores:');
        deliveryNote.workers.forEach((w) => {
          doc.font('Helvetica').text(`  • ${w.name}: ${w.hours}h`);
        });
      }
    }

    // Firma
    if (deliveryNote.signed) {
      sectionTitle(doc, 'Firma');
      field(doc, 'Firmado el', formatDate(deliveryNote.signedAt));

      if (signatureBuffer) {
        doc.moveDown(0.5).image(signatureBuffer, { width: 200 });
      }
    }

    // Pie
    doc.moveDown(2)
      .fontSize(8).fillColor('#aaaaaa').font('Helvetica')
      .text(`Generado por BildyApp · ${new Date().toLocaleString('es-ES')}`, { align: 'center' });

    doc.end();
  });
