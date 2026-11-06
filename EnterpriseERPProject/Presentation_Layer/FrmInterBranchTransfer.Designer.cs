namespace EnterpriseERPProject.Presentation_Layer
{
    partial class FrmInterBranchTransfer
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
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle1 = new System.Windows.Forms.DataGridViewCellStyle();
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle2 = new System.Windows.Forms.DataGridViewCellStyle();
            this.panelHeader = new System.Windows.Forms.Panel();
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblSub = new System.Windows.Forms.Label();
            this.grpTransferInfo = new System.Windows.Forms.GroupBox();
            this.txtFromBranch = new System.Windows.Forms.TextBox();
            this.cmbToBranch = new System.Windows.Forms.ComboBox();
            this.txtOperator = new System.Windows.Forms.TextBox();
            this.txtTransferDate = new System.Windows.Forms.TextBox();
            this.txtNotes = new System.Windows.Forms.TextBox();
            this.lblFrom = new System.Windows.Forms.Label();
            this.lblTo = new System.Windows.Forms.Label();
            this.lblUser = new System.Windows.Forms.Label();
            this.lblDate = new System.Windows.Forms.Label();
            this.lblNotes = new System.Windows.Forms.Label();
            this.TransferGrid = new System.Windows.Forms.DataGridView();
            this.ColProductLookup = new System.Windows.Forms.DataGridViewComboBoxColumn();
            this.ProductID = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ProductCode = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.ProductName = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Quantity = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.CostPrice = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.TotalCost = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.panelFooter = new System.Windows.Forms.Panel();
            this.lblItemCount = new System.Windows.Forms.Label();
            this.lblTotalQty = new System.Windows.Forms.Label();
            this.lblTotalCost = new System.Windows.Forms.Label();
            this.labelTotalQtyTitle = new System.Windows.Forms.Label();
            this.labelTotalCostTitle = new System.Windows.Forms.Label();
            this.labelItemCountTitle = new System.Windows.Forms.Label();
            this.btnConfirmTransfer = new System.Windows.Forms.Button();
            this.btnClear = new System.Windows.Forms.Button();
            this.btnClose = new System.Windows.Forms.Button();
            this.panelHeader.SuspendLayout();
            this.grpTransferInfo.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.TransferGrid)).BeginInit();
            this.panelFooter.SuspendLayout();
            this.SuspendLayout();
            // 
            // panelHeader
            // 
            this.panelHeader.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(15)))), ((int)(((byte)(23)))), ((int)(((byte)(42)))));
            this.panelHeader.Controls.Add(this.lblTitle);
            this.panelHeader.Controls.Add(this.lblSub);
            this.panelHeader.Dock = System.Windows.Forms.DockStyle.Top;
            this.panelHeader.Location = new System.Drawing.Point(0, 0);
            this.panelHeader.Name = "panelHeader";
            this.panelHeader.Size = new System.Drawing.Size(960, 60);
            this.panelHeader.TabIndex = 0;
            // 
            // lblTitle
            // 
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Tahoma", 12F, System.Drawing.FontStyle.Bold);
            this.lblTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(251)))), ((int)(((byte)(191)))), ((int)(((byte)(36)))));
            this.lblTitle.Location = new System.Drawing.Point(540, 15);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(400, 24);
            this.lblTitle.TabIndex = 0;
            this.lblTitle.Text = "برنامج العقرب المحاسبي | التحويل المخزني المباشر";
            // 
            // lblSub
            // 
            this.lblSub.AutoSize = true;
            this.lblSub.Font = new System.Drawing.Font("Tahoma", 9F);
            this.lblSub.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(148)))), ((int)(((byte)(163)))), ((int)(((byte)(184)))));
            this.lblSub.Location = new System.Drawing.Point(20, 20);
            this.lblSub.Name = "lblSub";
            this.lblSub.Size = new System.Drawing.Size(340, 18);
            this.lblSub.TabIndex = 1;
            this.lblSub.Text = "نظام الأسهل انتربرايس - تسوية وتحديث أرصدة الفروع آلياً";
            // 
            // grpTransferInfo
            // 
            this.grpTransferInfo.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.grpTransferInfo.Controls.Add(this.txtFromBranch);
            this.grpTransferInfo.Controls.Add(this.cmbToBranch);
            this.grpTransferInfo.Controls.Add(this.txtOperator);
            this.grpTransferInfo.Controls.Add(this.txtTransferDate);
            this.grpTransferInfo.Controls.Add(this.txtNotes);
            this.grpTransferInfo.Controls.Add(this.lblFrom);
            this.grpTransferInfo.Controls.Add(this.lblTo);
            this.grpTransferInfo.Controls.Add(this.lblUser);
            this.grpTransferInfo.Controls.Add(this.lblDate);
            this.grpTransferInfo.Controls.Add(this.lblNotes);
            this.grpTransferInfo.Font = new System.Drawing.Font("Tahoma", 9F, System.Drawing.FontStyle.Bold);
            this.grpTransferInfo.Location = new System.Drawing.Point(15, 70);
            this.grpTransferInfo.Name = "grpTransferInfo";
            this.grpTransferInfo.Size = new System.Drawing.Size(930, 130);
            this.grpTransferInfo.TabIndex = 1;
            this.grpTransferInfo.TabStop = false;
            this.grpTransferInfo.Text = "بيانات أمر التحويل المخزني";
            // 
            // txtFromBranch
            // 
            this.txtFromBranch.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(241)))), ((int)(((byte)(245)))), ((int)(((byte)(249)))));
            this.txtFromBranch.Font = new System.Drawing.Font("Tahoma", 9F);
            this.txtFromBranch.Location = new System.Drawing.Point(540, 28);
            this.txtFromBranch.Name = "txtFromBranch";
            this.txtFromBranch.ReadOnly = true;
            this.txtFromBranch.Size = new System.Drawing.Size(250, 26);
            this.txtFromBranch.TabIndex = 0;
            // 
            // cmbToBranch
            // 
            this.cmbToBranch.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbToBranch.Font = new System.Drawing.Font("Tahoma", 9F);
            this.cmbToBranch.FormattingEnabled = true;
            this.cmbToBranch.Location = new System.Drawing.Point(100, 28);
            this.cmbToBranch.Name = "cmbToBranch";
            this.cmbToBranch.Size = new System.Drawing.Size(280, 26);
            this.cmbToBranch.TabIndex = 1;
            // 
            // txtOperator
            // 
            this.txtOperator.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(241)))), ((int)(((byte)(245)))), ((int)(((byte)(249)))));
            this.txtOperator.Font = new System.Drawing.Font("Tahoma", 9F);
            this.txtOperator.Location = new System.Drawing.Point(540, 62);
            this.txtOperator.Name = "txtOperator";
            this.txtOperator.ReadOnly = true;
            this.txtOperator.Size = new System.Drawing.Size(250, 26);
            this.txtOperator.TabIndex = 2;
            // 
            // txtTransferDate
            // 
            this.txtTransferDate.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(241)))), ((int)(((byte)(245)))), ((int)(((byte)(249)))));
            this.txtTransferDate.Font = new System.Drawing.Font("Tahoma", 9F);
            this.txtTransferDate.Location = new System.Drawing.Point(100, 62);
            this.txtTransferDate.Name = "txtTransferDate";
            this.txtTransferDate.ReadOnly = true;
            this.txtTransferDate.Size = new System.Drawing.Size(280, 26);
            this.txtTransferDate.TabIndex = 3;
            // 
            // txtNotes
            // 
            this.txtNotes.Font = new System.Drawing.Font("Tahoma", 9F);
            this.txtNotes.Location = new System.Drawing.Point(100, 95);
            this.txtNotes.Name = "txtNotes";
            this.txtNotes.Size = new System.Drawing.Size(690, 26);
            this.txtNotes.TabIndex = 4;
            // 
            // lblFrom
            // 
            this.lblFrom.AutoSize = true;
            this.lblFrom.Font = new System.Drawing.Font("Tahoma", 9F);
            this.lblFrom.Location = new System.Drawing.Point(800, 31);
            this.lblFrom.Name = "lblFrom";
            this.lblFrom.Size = new System.Drawing.Size(117, 18);
            this.lblFrom.TabIndex = 5;
            this.lblFrom.Text = "من فرع (المصدر):";
            // 
            // lblTo
            // 
            this.lblTo.AutoSize = true;
            this.lblTo.Font = new System.Drawing.Font("Tahoma", 9F);
            this.lblTo.Location = new System.Drawing.Point(390, 31);
            this.lblTo.Name = "lblTo";
            this.lblTo.Size = new System.Drawing.Size(130, 18);
            this.lblTo.TabIndex = 6;
            this.lblTo.Text = "إلى فرع (المستقبل):";
            // 
            // lblUser
            // 
            this.lblUser.AutoSize = true;
            this.lblUser.Font = new System.Drawing.Font("Tahoma", 9F);
            this.lblUser.Location = new System.Drawing.Point(800, 65);
            this.lblUser.Name = "lblUser";
            this.lblUser.Size = new System.Drawing.Size(107, 18);
            this.lblUser.TabIndex = 7;
            this.lblUser.Text = "الموظف المنفذ:";
            // 
            // lblDate
            // 
            this.lblDate.AutoSize = true;
            this.lblDate.Font = new System.Drawing.Font("Tahoma", 9F);
            this.lblDate.Location = new System.Drawing.Point(390, 65);
            this.lblDate.Name = "lblDate";
            this.lblDate.Size = new System.Drawing.Size(89, 18);
            this.lblDate.TabIndex = 8;
            this.lblDate.Text = "تاريخ التحويل:";
            // 
            // lblNotes
            // 
            this.lblNotes.AutoSize = true;
            this.lblNotes.Font = new System.Drawing.Font("Tahoma", 9F);
            this.lblNotes.Location = new System.Drawing.Point(800, 98);
            this.lblNotes.Name = "lblNotes";
            this.lblNotes.Size = new System.Drawing.Size(65, 18);
            this.lblNotes.TabIndex = 9;
            this.lblNotes.Text = "ملاحظات:";
            // 
            // TransferGrid
            // 
            this.TransferGrid.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            dataGridViewCellStyle1.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
            dataGridViewCellStyle1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(241)))), ((int)(((byte)(245)))), ((int)(((byte)(249)))));
            dataGridViewCellStyle1.Font = new System.Drawing.Font("Tahoma", 9F, System.Drawing.FontStyle.Bold);
            dataGridViewCellStyle1.ForeColor = System.Drawing.SystemColors.WindowText;
            dataGridViewCellStyle1.SelectionBackColor = System.Drawing.SystemColors.Highlight;
            dataGridViewCellStyle1.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
            dataGridViewCellStyle1.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
            this.TransferGrid.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle1;
            this.TransferGrid.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.TransferGrid.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.ColProductLookup,
            this.ProductID,
            this.ProductCode,
            this.ProductName,
            this.Quantity,
            this.CostPrice,
            this.TotalCost});
            this.TransferGrid.Location = new System.Drawing.Point(15, 210);
            this.TransferGrid.Name = "TransferGrid";
            this.TransferGrid.RowTemplate.Height = 28;
            this.TransferGrid.Size = new System.Drawing.Size(930, 260);
            this.TransferGrid.TabIndex = 2;
            this.TransferGrid.CellValueChanged += new System.Windows.Forms.DataGridViewCellEventHandler(this.TransferGrid_CellValueChanged);
            // 
            // ColProductLookup
            // 
            this.ColProductLookup.HeaderText = "اختيار صنف سريع";
            this.ColProductLookup.Name = "ColProductLookup";
            this.ColProductLookup.Width = 180;
            // 
            // ProductID
            // 
            this.ProductID.HeaderText = "معرف الصنف";
            this.ProductID.Name = "ProductID";
            this.ProductID.ReadOnly = true;
            this.ProductID.Width = 90;
            // 
            // ProductCode
            // 
            this.ProductCode.HeaderText = "كود الصنف";
            this.ProductCode.Name = "ProductCode";
            this.ProductCode.ReadOnly = true;
            this.ProductCode.Width = 110;
            // 
            // ProductName
            // 
            this.ProductName.HeaderText = "اسم الصنف والوصف";
            this.ProductName.Name = "ProductName";
            this.ProductName.Width = 240;
            // 
            // Quantity
            // 
            this.Quantity.HeaderText = "الكمية المحولة";
            this.Quantity.Name = "Quantity";
            this.Quantity.Width = 100;
            // 
            // CostPrice
            // 
            this.CostPrice.HeaderText = "سعر التكلفة";
            this.CostPrice.Name = "CostPrice";
            this.CostPrice.Width = 100;
            // 
            // TotalCost
            // 
            dataGridViewCellStyle2.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(254)))), ((int)(((byte)(243)))), ((int)(((byte)(199)))));
            this.TotalCost.DefaultCellStyle = dataGridViewCellStyle2;
            this.TotalCost.HeaderText = "إجمالي التكلفة";
            this.TotalCost.Name = "TotalCost";
            this.TotalCost.ReadOnly = true;
            this.TotalCost.Width = 110;
            // 
            // panelFooter
            // 
            this.panelFooter.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(248)))), ((int)(((byte)(250)))), ((int)(((byte)(252)))));
            this.panelFooter.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.panelFooter.Controls.Add(this.lblItemCount);
            this.panelFooter.Controls.Add(this.lblTotalQty);
            this.panelFooter.Controls.Add(this.lblTotalCost);
            this.panelFooter.Controls.Add(this.labelTotalCostTitle);
            this.panelFooter.Controls.Add(this.labelTotalQtyTitle);
            this.panelFooter.Controls.Add(this.labelItemCountTitle);
            this.panelFooter.Controls.Add(this.btnConfirmTransfer);
            this.panelFooter.Controls.Add(this.btnClear);
            this.panelFooter.Controls.Add(this.btnClose);
            this.panelFooter.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.panelFooter.Location = new System.Drawing.Point(0, 480);
            this.panelFooter.Name = "panelFooter";
            this.panelFooter.Size = new System.Drawing.Size(960, 80);
            this.panelFooter.TabIndex = 3;
            // 
            // lblItemCount
            // 
            this.lblItemCount.Font = new System.Drawing.Font("Tahoma", 10F, System.Drawing.FontStyle.Bold);
            this.lblItemCount.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(41)))), ((int)(((byte)(59)))));
            this.lblItemCount.Location = new System.Drawing.Point(780, 40);
            this.lblItemCount.Name = "lblItemCount";
            this.lblItemCount.Size = new System.Drawing.Size(150, 24);
            this.lblItemCount.TabIndex = 0;
            this.lblItemCount.Text = "0 صنف";
            this.lblItemCount.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // lblTotalQty
            // 
            this.lblTotalQty.Font = new System.Drawing.Font("Tahoma", 10F, System.Drawing.FontStyle.Bold);
            this.lblTotalQty.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(2)))), ((int)(((byte)(132)))), ((int)(((byte)(199)))));
            this.lblTotalQty.Location = new System.Drawing.Point(620, 40);
            this.lblTotalQty.Name = "lblTotalQty";
            this.lblTotalQty.Size = new System.Drawing.Size(150, 24);
            this.lblTotalQty.TabIndex = 1;
            this.lblTotalQty.Text = "0";
            this.lblTotalQty.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // lblTotalCost
            // 
            this.lblTotalCost.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(20)))), ((int)(((byte)(83)))), ((int)(((byte)(45)))));
            this.lblTotalCost.Font = new System.Drawing.Font("Consolas", 12F, System.Drawing.FontStyle.Bold);
            this.lblTotalCost.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(74)))), ((int)(((byte)(222)))), ((int)(((byte)(128)))));
            this.lblTotalCost.Location = new System.Drawing.Point(400, 36);
            this.lblTotalCost.Name = "lblTotalCost";
            this.lblTotalCost.Size = new System.Drawing.Size(200, 32);
            this.lblTotalCost.TabIndex = 2;
            this.lblTotalCost.Text = "0.00 ر.س";
            this.lblTotalCost.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // labelItemCountTitle
            // 
            this.labelItemCountTitle.AutoSize = true;
            this.labelItemCountTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(100)))), ((int)(((byte)(116)))), ((int)(((byte)(139)))));
            this.labelItemCountTitle.Location = new System.Drawing.Point(820, 15);
            this.labelItemCountTitle.Name = "labelItemCountTitle";
            this.labelItemCountTitle.Size = new System.Drawing.Size(81, 17);
            this.labelItemCountTitle.TabIndex = 3;
            this.labelItemCountTitle.Text = "عدد الأصناف:";
            // 
            // labelTotalQtyTitle
            // 
            this.labelTotalQtyTitle.AutoSize = true;
            this.labelTotalQtyTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(100)))), ((int)(((byte)(116)))), ((int)(((byte)(139)))));
            this.labelTotalQtyTitle.Location = new System.Drawing.Point(650, 15);
            this.labelTotalQtyTitle.Name = "labelTotalQtyTitle";
            this.labelTotalQtyTitle.Size = new System.Drawing.Size(95, 17);
            this.labelTotalQtyTitle.TabIndex = 4;
            this.labelTotalQtyTitle.Text = "إجمالي الكميات:";
            // 
            // labelTotalCostTitle
            // 
            this.labelTotalCostTitle.AutoSize = true;
            this.labelTotalCostTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(100)))), ((int)(((byte)(116)))), ((int)(((byte)(139)))));
            this.labelTotalCostTitle.Location = new System.Drawing.Point(440, 15);
            this.labelTotalCostTitle.Name = "labelTotalCostTitle";
            this.labelTotalCostTitle.Size = new System.Drawing.Size(124, 17);
            this.labelTotalCostTitle.TabIndex = 5;
            this.labelTotalCostTitle.Text = "إجمالي تكلفة القيد:";
            // 
            // btnConfirmTransfer
            // 
            this.btnConfirmTransfer.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(16)))), ((int)(((byte)(185)))), ((int)(((byte)(129)))));
            this.btnConfirmTransfer.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnConfirmTransfer.FlatAppearance.BorderSize = 0;
            this.btnConfirmTransfer.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnConfirmTransfer.Font = new System.Drawing.Font("Tahoma", 10F, System.Drawing.FontStyle.Bold);
            this.btnConfirmTransfer.ForeColor = System.Drawing.Color.White;
            this.btnConfirmTransfer.Location = new System.Drawing.Point(180, 18);
            this.btnConfirmTransfer.Name = "btnConfirmTransfer";
            this.btnConfirmTransfer.Size = new System.Drawing.Size(200, 44);
            this.btnConfirmTransfer.TabIndex = 6;
            this.btnConfirmTransfer.Text = "✓ تأكيد وترحيل التحويل";
            this.btnConfirmTransfer.UseVisualStyleBackColor = false;
            this.btnConfirmTransfer.Click += new System.EventHandler(this.btnConfirmTransfer_Click);
            // 
            // btnClear
            // 
            this.btnClear.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(226)))), ((int)(((byte)(232)))), ((int)(((byte)(240)))));
            this.btnClear.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnClear.Location = new System.Drawing.Point(95, 18);
            this.btnClear.Name = "btnClear";
            this.btnClear.Size = new System.Drawing.Size(75, 44);
            this.btnClear.TabIndex = 7;
            this.btnClear.Text = "مسح";
            this.btnClear.UseVisualStyleBackColor = false;
            this.btnClear.Click += new System.EventHandler(this.btnClear_Click);
            // 
            // btnClose
            // 
            this.btnClose.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(226)))), ((int)(((byte)(232)))), ((int)(((byte)(240)))));
            this.btnClose.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnClose.Location = new System.Drawing.Point(15, 18);
            this.btnClose.Name = "btnClose";
            this.btnClose.Size = new System.Drawing.Size(75, 44);
            this.btnClose.TabIndex = 8;
            this.btnClose.Text = "إغلاق";
            this.btnClose.UseVisualStyleBackColor = false;
            this.btnClose.Click += new System.EventHandler(this.btnClose_Click);
            // 
            // FrmInterBranchTransfer
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.ClientSize = new System.Drawing.Size(960, 560);
            this.Controls.Add(this.panelFooter);
            this.Controls.Add(this.TransferGrid);
            this.Controls.Add(this.grpTransferInfo);
            this.Controls.Add(this.panelHeader);
            this.Font = new System.Drawing.Font("Tahoma", 8F);
            this.Name = "FrmInterBranchTransfer";
            this.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "برنامج العقرب المحاسبي - التحويل المخزني بين الفروع";
            this.Load += new System.EventHandler(this.FrmInterBranchTransfer_Load);
            this.panelHeader.ResumeLayout(false);
            this.panelHeader.PerformLayout();
            this.grpTransferInfo.ResumeLayout(false);
            this.grpTransferInfo.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.TransferGrid)).EndInit();
            this.panelFooter.ResumeLayout(false);
            this.panelFooter.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel panelHeader;
        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblSub;
        private System.Windows.Forms.GroupBox grpTransferInfo;
        private System.Windows.Forms.TextBox txtFromBranch;
        private System.Windows.Forms.ComboBox cmbToBranch;
        private System.Windows.Forms.TextBox txtOperator;
        private System.Windows.Forms.TextBox txtTransferDate;
        private System.Windows.Forms.TextBox txtNotes;
        private System.Windows.Forms.Label lblFrom;
        private System.Windows.Forms.Label lblTo;
        private System.Windows.Forms.Label lblUser;
        private System.Windows.Forms.Label lblDate;
        private System.Windows.Forms.Label lblNotes;
        private System.Windows.Forms.DataGridView TransferGrid;
        private System.Windows.Forms.Panel panelFooter;
        private System.Windows.Forms.Label lblItemCount;
        private System.Windows.Forms.Label lblTotalQty;
        private System.Windows.Forms.Label lblTotalCost;
        private System.Windows.Forms.Label labelItemCountTitle;
        private System.Windows.Forms.Label labelTotalQtyTitle;
        private System.Windows.Forms.Label labelTotalCostTitle;
        private System.Windows.Forms.Button btnConfirmTransfer;
        private System.Windows.Forms.Button btnClear;
        private System.Windows.Forms.Button btnClose;
        private System.Windows.Forms.DataGridViewComboBoxColumn ColProductLookup;
        private System.Windows.Forms.DataGridViewTextBoxColumn ProductID;
        private System.Windows.Forms.DataGridViewTextBoxColumn ProductCode;
        private System.Windows.Forms.DataGridViewTextBoxColumn ProductName;
        private System.Windows.Forms.DataGridViewTextBoxColumn Quantity;
        private System.Windows.Forms.DataGridViewTextBoxColumn CostPrice;
        private System.Windows.Forms.DataGridViewTextBoxColumn TotalCost;
    }
}
