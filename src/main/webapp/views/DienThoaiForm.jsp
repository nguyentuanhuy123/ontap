<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%--
  Created by IntelliJ IDEA.
  User: Admin
  Date: 10/1/2025
  Time: 9:53 AM
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<jsp:include page="header.jsp"/>
<html>
<head>
    <title>Title</title>
    <style>
        body{
            display: flex;
            flex-direction: column;
            margin: 0;
            min-height: 100vh;
            justify-content: center;
            align-items: center;
        }
        main{
            flex: 1;
            padding-top: 20px;
            padding-bottom: 20px;
        }
        select,input{
            width: 500px;
            min-height: 30px;
            border: 1px solid gray;
            border-radius: 6px 8px;
        }
        table{
            margin-top: 20px;
            margin-bottom: 20px;
            width: auto;
            box-shadow: 0 5px 10px gray;
            table-layout: auto;
            border:1px solid black;
            border-collapse: collapse;
        }
        td,th{
            padding: 8px 10px;
            border: 1px solid black;
            white-space: nowrap;
        }
        th{
            background-color: #fafafa;
        }
        td{
            background-color: aliceblue;
        }
        tr:hover{
            background-color: gray;
        }
        form{
            flex: 1;
            flex-direction: column;
            gap: 10px;
            display: flex;
        }

    </style><script>

    function validateForm() {

        const maDt = document.getElementById('maDt').value.trim();
        const tenDt = document.getElementById('tenDt').value.trim();
        const nam = document.getElementById('namSanXuat').value.trim();
        const cauHinh = document.getElementById('cauHinh').value.trim();
        const maNcc = document.getElementById('maNcc').value;
        const fileInput = document.getElementById('hinhAnh');

        if (!maDt || !tenDt || !nam || !cauHinh || !maNcc) {
            alert('Vui lòng nhập đầy đủ: Mã ĐT, Tên, Năm sản xuất, Thông tin cấu hình và chọn Nhà cung cấp.');
            return false;
        }

        const reYear = /^\d{4}$/;
        if (!reYear.test(nam)) {
            alert('Năm sản xuất phải là 4 chữ số (ví dụ: 2023).');
            document.getElementById('namSanXuat').focus();
            return false;
        }

        if (cauHinh.length > 255) {
            alert('Thông tin cấu hình không được vượt quá 255 ký tự.');
            document.getElementById('cauHinh').focus();
            return false;
        }
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            const reImg = /\.(png|jpe?g)$/i;
            if (!reImg.test(fileName)) {
                alert('Hình ảnh chỉ chấp nhận định dạng: png, jpg, jpeg.');
                fileInput.focus();
                return false;
            }
        }
        return true;
    }
</script>
</head>
<body>
<main>
    <h2>Them San Pham</h2>
    <form action="${pageContext.request.contextPath}/dt-form" method="post" enctype="multipart/form-data" onsubmit="return validateForm()">
        <label>Ma Dt:</label>
        <input type="text" name="maDt" id="maDt">

        <label>Tên điện thoại:</label>
        <input type="text" name="tenDt" id="tenDt">

        <label>Năm sản xuất:</label>
        <input type="text" name="namSanXuat" id="namSanXuat">

        <label>Thông tin cấu hình:</label>
        <textarea type="text" name="cauHinh" id="cauHinh" rows="4"></textarea>

        <label>Nha cung cap:</label>
        <select type="text" name="maNcc" id="maNcc">
            <option value="">-- Chon Nha Cung Cap --</option>
            <c:forEach var="ncc" items="${nccs}">
                <option value="${ncc.maNcc}">${ncc.tenNhaCc} ${ncc.maNcc}</option>
            </c:forEach>
        </select>

        <label>Hình ảnh:</label>
        <input type="file" name="hinhAnh" id="hinhAnh">

        <div>
            <button type="reset">reset</button>
            <button type="submit">submit</button>
        </div>
    </form>
</main>
</body>
</html>
<jsp:include page="footer.jsp"/>

