-- =========================================================================
-- برنامج العقرب المحاسبي - Enterprise ERP Project
-- سكريبت إنشاء جداول الورديات (POS Shifts) ومشاريع المقاولات والمستخلصات الآجلة
-- =========================================================================

-- 1. جدول إدارة شفتات نقاط البيع السريعة (POS Shifts Management)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PosShifts')
BEGIN
    CREATE TABLE PosShifts (
        ShiftID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        BranchID INT NOT NULL,
        OpeningCash DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
        ClosingExpectedCash DECIMAL(18,4) NULL,
        ClosingActualCash DECIMAL(18,4) NULL,
        Variance DECIMAL(18,4) NULL,
        StartTime DATETIME NOT NULL DEFAULT GETDATE(),
        EndTime DATETIME NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Open', -- 'Open', 'Closed'
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

        -- قيود الأداء والتحقق
        CONSTRAINT CHK_PosShifts_Status CHECK (Status IN ('Open', 'Closed')),
        CONSTRAINT CHK_PosShifts_OpeningCash CHECK (OpeningCash >= 0)
    );

    -- فهرس عالي السرعة للتحقق الفوري من الورديات المفتوحة للمستخدم والفرع
    CREATE NONCLUSTERED INDEX IX_PosShifts_User_Branch_Status 
    ON PosShifts (UserID, BranchID, Status) 
    INCLUDE (StartTime, OpeningCash);
END
GO

-- 2. جدول مشاريع وعقود المقاولات للشركات (Commercial & Contracting Projects)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommercialProjects')
BEGIN
    CREATE TABLE CommercialProjects (
        ProjectID INT PRIMARY KEY IDENTITY(1,1),
        ProjectName NVARCHAR(150) NOT NULL,
        CustomerID INT NOT NULL,
        TotalContractValue DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
        BranchID INT NULL,
        CostCenterID INT NULL, -- ربط المشروع بمركز تكلفة في دليل الحسابات
        StartDate DATE NULL,
        ExpectedEndDate DATE NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'Active', -- 'Active', 'Completed', 'Suspended'
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE NONCLUSTERED INDEX IX_CommercialProjects_Customer 
    ON CommercialProjects (CustomerID, Status);
END
GO

-- 3. جدول فواتير ومستخلصات المقاولات والشركات بالآجل (Project Invoices & Progress Billings)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectInvoices')
BEGIN
    CREATE TABLE ProjectInvoices (
        InvoiceID INT PRIMARY KEY IDENTITY(1,1),
        InvoiceNumber NVARCHAR(50) NOT NULL UNIQUE,
        CustomerID INT NOT NULL,
        ProjectID INT NOT NULL,
        NetTotal DECIMAL(18,4) NOT NULL,
        PaidAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000, -- دعم السداد الجزئي للمستخلصات
        RemainingBalance AS (NetTotal - PaidAmount),       -- حقل محسوب آلياً لرصيد الفاتورة المتبقي
        DueDate DATETIME NOT NULL,
        BranchID INT NOT NULL,
        IsPaid BIT NOT NULL DEFAULT 0,
        Notes NVARCHAR(255) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

        -- ربط الفاتورة بالمشروع
        CONSTRAINT FK_ProjectInvoices_CommercialProjects 
            FOREIGN KEY (ProjectID) REFERENCES CommercialProjects(ProjectID)
            ON UPDATE CASCADE ON DELETE NO ACTION,

        CONSTRAINT CHK_ProjectInvoices_NetTotal CHECK (NetTotal > 0)
    );

    -- فهرس تسريع استعلامات متابعة الذمم وتواريخ استحقاق المستخلصات
    CREATE NONCLUSTERED INDEX IX_ProjectInvoices_Project_Due 
    ON ProjectInvoices (ProjectID, DueDate, IsPaid) 
    INCLUDE (NetTotal, CustomerID);
END
GO

-- =========================================================================
-- 4. تحديث وترقية جدول فواتير المبيعات والقيود لدعم الترحيل الفوري للتقارير (IsPosted)
-- =========================================================================

-- إنشاء جدول SalesInvoices في حال عدم وجوده مسبقاً
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesInvoices')
BEGIN
    CREATE TABLE SalesInvoices (
        InvoiceID INT PRIMARY KEY IDENTITY(1,1),
        InvoiceNumber NVARCHAR(50) NOT NULL,
        CustomerID INT NOT NULL,
        ProjectID INT NULL,
        TotalBeforeVat DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        TotalVat DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        NetTotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        BranchID INT NOT NULL DEFAULT 1,
        PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'Cash',
        CreatedBy NVARCHAR(100) NULL,
        InvoiceDate DATETIME NOT NULL DEFAULT GETDATE(),
        IsPosted BIT NOT NULL DEFAULT 0
    );
END
ELSE IF COL_LENGTH('SalesInvoices', 'IsPosted') IS NULL
BEGIN
    -- إضافة عمود IsPosted لجدول فواتير المبيعات القائم
    ALTER TABLE SalesInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;
END
GO

-- التأكد من وجود عمود ProjectID في جدول SalesInvoices لربط مراكز التكلفة والمشاريع
IF COL_LENGTH('SalesInvoices', 'ProjectID') IS NULL
BEGIN
    ALTER TABLE SalesInvoices ADD ProjectID INT NULL;
END
GO

-- التأكد من وجود عمود IsPosted في جدول فواتير المشتريات PurchaseInvoices (إن وجد)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseInvoices')
   AND COL_LENGTH('PurchaseInvoices', 'IsPosted') IS NULL
BEGIN
    ALTER TABLE PurchaseInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;
END
GO

-- التأكد من وجود عمود CostCenterID في جدول تفاصيل القيود JournalEntryDetails (إن وجد)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'JournalEntryDetails')
   AND COL_LENGTH('JournalEntryDetails', 'CostCenterID') IS NULL
BEGIN
    ALTER TABLE JournalEntryDetails ADD CostCenterID INT NULL;
END
GO

-- فهرس لتسريع توليد أرقام الفواتير التسلسلية لكل فرع واستعلامات الترحيل
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SalesInvoices_Branch_InvNo' AND object_id = OBJECT_ID('SalesInvoices'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_SalesInvoices_Branch_InvNo
    ON SalesInvoices (BranchID, InvoiceNumber)
    INCLUDE (IsPosted, NetTotal);
END
GO
