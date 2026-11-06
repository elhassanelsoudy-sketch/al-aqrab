namespace EnterpriseERPProject.Presentation_Layer
{
    partial class FrmStockTransfer
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.cmbFromBranch = new System.Windows.Forms.ComboBox();
            this.cmbToBranch = new System.Windows.Forms.ComboBox();
            this.txtTransferNo = new System.Windows.Forms.TextBox();
            this.txtTransferDate = new System.Windows.Forms.TextBox();
            this.txtNotes = new System.Windows.Forms.TextBox();
            this.lblStatusBadge = new System.Windows.Forms.Label();
            this.lblUser = new System.Windows.Forms.Label();
            this.GridDetails = new System.Windows.Forms.DataGridView();
            this.ColProductSelect = new System.Windows.Forms.DataGridViewComboBoxColumn();
            this.ColProductID = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ColProductCode = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ColProductName = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ColQuantity = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ColCost = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.btnSavePending = new System.Windows.Forms.Button();
            this.btnConfirmReceive = new System.Windows.Forms.Button();
            this.btnNew = new System.Windows.Forms.Button();
            this.btnPrint = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            ((System.ComponentModel.ISupportInitialize)(this.GridDetails)).BeginInit();
            this.SuspendLayout();
            // 
            // cmbFromBranch
            // 
            this.cmbFromBranch.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbFromBranch.FormattingEnabled = true;
            this.cmbFromBranch.Location = new System.Drawing.Point(540, 52);
            this.cmbFromBranch.Name = "cmbFromBranch";
            this.cmbFromBranch.Size = new System.Drawing.Size(220, 24);
            this.cmbFromBranch.TabIndex = 0;
            // 
            // cmbToBranch
            // 
            this.cmbToBranch.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbToBranch.FormattingEnabled = true;
            this.cmbToBranch.Location = new System.Drawing.Point(230, 52);
            this.cmbToBranch.Name = "cmbToBranch";
            this.cmbToBranch.Size = new System.Drawing.Size(220, 24);
            this.cmbToBranch.TabIndex = 1;
            // 
            // txtTransferNo
            // 
            this.txtTransferNo.Location = new System.Drawing.Point(540, 92);
            this.txtTransferNo.Name = "txtTransferNo";
            this.txtTransferNo.ReadOnly = true;
            this.txtTransferNo.Size = new System.Drawing.Size(220, 22);
            this.txtTransferNo.TabIndex = 2;
            // 
            // txtTransferDate
            // 
            this.txtTransferDate.Location = new System.Drawing.Point(230, 92);
            this.txtTransferDate.Name = "txtTransferDate";
            this.txtTransferDate.ReadOnly = true;
            this.txtTransferDate.Size = new System.Drawing.Size(220, 22);
            this.txtTransferDate.TabIndex = 3;
            // 
            // txtNotes
            // 
            this.txtNotes.Location = new System.Drawing.Point(30, 130);
            this.txtNotes.Name = "txtNotes";
            this.txtNotes.Size = new System.Drawing.Size(730, 22);
            this.txtNotes.TabIndex = 4;
            // 
            // lblStatusBadge
            // 
            this.lblStatusBadge.Font = new System.Drawing.Font("Tahoma", 10F, System.Drawing.FontStyle.Bold);
            this.lblStatusBadge.Location = new System.Drawing.Point(30, 48);
            this.lblStatusBadge.Name = "lblStatusBadge";
            this.lblStatusBadge.Size = new System.Drawing.Size(180, 30);
            this.lblStatusBadge.TabIndex = 5;
            this.lblStatusBadge.Text = "جديد - غير محفوظ";
            this.lblStatusBadge.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // lblUser
            // 
            this.lblUser.AutoSize = true;
            this.lblUser.Location = new System.Drawing.Point(30, 95);
            this.lblUser.Name = "lblUser";
            this.lblUser.Size = new System.Drawing.Size(70, 17);
            this.lblUser.TabIndex = 6;
            this.lblUser.Text = "المستخدم:";
            // 
            // GridDetails
            // 
            this.GridDetails.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.GridDetails.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.GridDetails.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.ColProductSelect,
            this.ColProductID,
            this.ColProductCode,
            this.ColProductName,
            this.ColQuantity,
            this.ColCost});
            this.GridDetails.Location = new System.Drawing.Point(30, 170);
            this.GridDetails.Name = "GridDetails";
            this.GridDetails.RowTemplate.Height = 24;
            this.GridDetails.Size = new System.Drawing.Size(830, 280);
            this.GridDetails.TabIndex = 7;
            // 
            // ColProductSelect
            // 
            this.ColProductSelect.HeaderText = "اختيار صنف";
            this.ColProductSelect.Name = "ColProductSelect";
            this.ColProductSelect.Width = 150;
            // 
            // ColProductID
            // 
            this.ColProductID.HeaderText = "معرف الصنف";
            this.ColProductID.Name = "ColProductID";
            this.ColProductID.ReadOnly = true;
            this.ColProductID.Width = 90;
            // 
            // ColProductCode
            // 
            this.ColProductCode.HeaderText = "كود الصنف";
            this.ColProductCode.Name = "ColProductCode";
            this.ColProductCode.ReadOnly = true;
            this.ColProductCode.Width = 110;
            // 
            // ColProductName
            // 
            this.ColProductName.HeaderText = "اسم الصنف";
            this.ColProductName.Name = "ColProductName";
            this.ColProductName.Width = 220;
            // 
            // ColQuantity
            // 
            this.ColQuantity.HeaderText = "الكمية المحولة";
            this.ColQuantity.Name = "ColQuantity";
            this.ColQuantity.Width = 110;
            // 
            // ColCost
            // 
            this.ColCost.HeaderText = "التكلفة التقديرية";
            this.ColCost.Name = "ColCost";
            this.ColCost.ReadOnly = true;
            this.ColCost.Width = 110;
            // 
            // btnSavePending
            // 
            this.btnSavePending.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btnSavePending.BackColor = System.Drawing.Color.SteelBlue;
            this.btnSavePending.ForeColor = System.Drawing.Color.White;
            this.btnSavePending.Location = new System.Drawing.Point(680, 470);
            this.btnSavePending.Name = "btnSavePending";
            this.btnSavePending.Size = new System.Drawing.Size(180, 42);
            this.btnSavePending.TabIndex = 8;
            this.btnSavePending.Text = "ترحيل ونقل (Pending)";
            this.btnSavePending.UseVisualStyleBackColor = false;
            this.btnSavePending.Click += new System.EventHandler(this.btnSavePending_Click);
            // 
            // btnConfirmReceive
            // 
            this.btnConfirmReceive.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btnConfirmReceive.BackColor = System.Drawing.Color.SeaGreen;
            this.btnConfirmReceive.ForeColor = System.Drawing.Color.White;
            this.btnConfirmReceive.Location = new System.Drawing.Point(480, 470);
            this.btnConfirmReceive.Name = "btnConfirmReceive";
            this.btnConfirmReceive.Size = new System.Drawing.Size(190, 42);
            this.btnConfirmReceive.TabIndex = 9;
            this.btnConfirmReceive.Text = "تأكيد الاستلام (Confirmed)";
            this.btnConfirmReceive.UseVisualStyleBackColor = false;
            this.btnConfirmReceive.Click += new System.EventHandler(this.btnConfirmReceive_Click);
            // 
            // btnNew
            // 
            this.btnNew.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.btnNew.Location = new System.Drawing.Point(30, 470);
            this.btnNew.Name = "btnNew";
            this.btnNew.Size = new System.Drawing.Size(110, 42);
            this.btnNew.TabIndex = 10;
            this.btnNew.Text = "سند جديد";
            this.btnNew.UseVisualStyleBackColor = true;
            this.btnNew.Click += new System.EventHandler(this.btnNew_Click);
            // 
            // btnPrint
            // 
            this.btnPrint.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.btnPrint.Location = new System.Drawing.Point(150, 470);
            this.btnPrint.Name = "btnPrint";
            this.btnPrint.Size = new System.Drawing.Size(110, 42);
            this.btnPrint.TabIndex = 11;
            this.btnPrint.Text = "طباعة السند";
            this.btnPrint.UseVisualStyleBackColor = true;
            this.btnPrint.Click += new System.EventHandler(this.btnPrint_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(766, 55);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(95, 17);
            this.label1.TabIndex = 12;
            this.label1.Text = "من فرع / مخزن:";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(456, 55);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(65, 17);
            this.label2.TabIndex = 13;
            this.label2.Text = "إلى فرع:";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(766, 95);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(81, 17);
            this.label3.TabIndex = 14;
            this.label3.Text = "رقم السند:";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(456, 95);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(48, 17);
            this.label4.TabIndex = 15;
            this.label4.Text = "التاريخ:";
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(766, 133);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(64, 17);
            this.label5.TabIndex = 16;
            this.label5.Text = "ملاحظات:";
            // 
            // FrmStockTransfer
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(890, 530);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.btnPrint);
            this.Controls.Add(this.btnNew);
            this.Controls.Add(this.btnConfirmReceive);
            this.Controls.Add(this.btnSavePending);
            this.Controls.Add(this.GridDetails);
            this.Controls.Add(this.lblUser);
            this.Controls.Add(this.lblStatusBadge);
            this.Controls.Add(this.txtNotes);
            this.Controls.Add(this.txtTransferDate);
            this.Controls.Add(this.txtTransferNo);
            this.Controls.Add(this.cmbToBranch);
            this.Controls.Add(this.cmbFromBranch);
            this.Font = new System.Drawing.Font("Tahoma", 8F);
            this.Name = "FrmStockTransfer";
            this.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "برنامج العقرب المحاسبي - سند تحويل مخزني بين الفروع";
            this.Load += new System.EventHandler(this.FrmStockTransfer_Load);
            ((System.ComponentModel.ISupportInitialize)(this.GridDetails)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ComboBox cmbFromBranch;
        private System.Windows.Forms.ComboBox cmbToBranch;
        private System.Windows.Forms.TextBox txtTransferNo;
        private System.Windows.Forms.TextBox txtTransferDate;
        private System.Windows.Forms.TextBox txtNotes;
        private System.Windows.Forms.Label lblStatusBadge;
        private System.Windows.Forms.Label lblUser;
        private System.Windows.Forms.DataGridView GridDetails;
        private System.Windows.Forms.Button btnSavePending;
        private System.Windows.Forms.Button btnConfirmReceive;
        private System.Windows.Forms.Button btnNew;
        private System.Windows.Forms.Button btnPrint;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.DataGridViewComboBoxColumn ColProductSelect;
        private System.Windows.Forms.DataGridViewTextBoxColumn ColProductID;
        private System.Windows.Forms.DataGridViewTextBoxColumn ColProductCode;
        private System.Windows.Forms.DataGridViewTextBoxColumn ColProductName;
        private System.Windows.Forms.DataGridViewTextBoxColumn ColQuantity;
        private System.Windows.Forms.DataGridViewTextBoxColumn ColCost;
    }
}
