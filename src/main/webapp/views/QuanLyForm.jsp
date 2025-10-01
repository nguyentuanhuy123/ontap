<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%--
  Created by IntelliJ IDEA.
  User: Admin
  Date: 10/1/2025
  Time: 5:01 PM
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
            justify-content: center;
            align-items: center;
            margin: 0;
            min-height: 100vh;
        }
        main{
            flex: 1;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        select,input{
            width: 400px;
            min-height: 30px;
            border: 1px solid black;
            border-radius: 8px 6px;
        }
        table{
            margin-top: 20px;
            margin-bottom: 20px;
            table-layout: auto;
            border-collapse: collapse;
            border: 1px solid black;
        }
        th,td{
            padding: 8px 6px;
            white-space: nowrap;
            border: 1px solid black;
        }
        th{
            background-color: #fafafa;
        }
        td{
            background-color: aqua;
        }
    </style>
</head>
<body>
<main>
    <form action="${pageContext.request.contextPath}/quanly" method="get">
        <input type="text" name="kw" id="kw" placeholder="Tìm kiếm thông tin NCC theo MANCC hoặc TENNHACC hoặc DIACHI hoặc
SODIENTHOAI" oninput="document.getElementById('maNcc').value='';this.form.submit();  ">
        <select name="maNcc" id="maNcc"
                onchange="document.getElementById('kw').value='';this.form.submit();  ">
            <option value="">-- Tat ca Nha Cung Cap --</option>
            <c:forEach var="ncc" items="${nccs1}">
                <option value="${ncc.maNcc}" ${param.maNcc eq ncc.maNcc?'selected':''}>${ncc.tenNhaCc} ${ncc.maNcc}</option>
            </c:forEach>
        </select>
    </form>
    <h2>Thong tin nha cung cap</h2>
    <table>
        <thead>
        <tr>
            <th>MANCC</th>
            <th>TENNHACC</th>
            <th>DIACHI</th>
            <th>SODIENTHOAI</th>
        </tr>
        </thead>
        <tbody>
        <c:forEach var="n" items="${nccs}">
            <tr>
                <td>${n.maNcc}</td>
                <td>${n.tenNhaCc}</td>
                <td>${n.diaChi}</td>
                <td>${n.soDienThoai}</td>
            </tr>
        </c:forEach>
        </tbody>
    </table>
    <h2>Thong tin dienthoai</h2>
    <table>
        <thead>
        <tr>
            <th>MADT</th>
            <th>TENDT</th>
            <th>NAMSANXUAT</th>
            <th>CAUHINH</th>
            <th>MANCC</th>
            <th>HINHANH</th>
        </tr>
        </thead>
        <tbody>
        <c:forEach var="n" items="${dts}">
            <tr>
                <td>${n.maDt}</td>
                <td>${n.tenDt}</td>
                <td>${n.namSanXuat}</td>
                <td>${n.cauHinh}</td>
                <td>${n.ncc.maNcc}</td>
                <td>
                    <img src="${pageContext.request.contextPath}/images/${n.hinhAnh}" style="width: 100px;height: 100px;object-fit: fill;">
                </td>
                <td>
                    <form action="${pageContext.request.contextPath}/quanly" method="post">
                        <input type="hidden" name="maDt" id="maDt" value="${n.maDt}">
                        <button type="submit">Xoa</button>
                    </form>
                </td>
            </tr>
        </c:forEach>
        </tbody>
    </table>
</main>
</body>
</html>
<jsp:include page="footer.jsp"/>