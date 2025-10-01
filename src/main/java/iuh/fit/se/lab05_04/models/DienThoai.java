package iuh.fit.se.lab05_04.models;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dienthoai")
public class DienThoai {
    @Id
    @Column(name = "MADT")
    private String maDt;
    @Column(name = "TENDT")
    private String tenDt;
    @Column(name = "NAMSANXUAT")
    private String namSanXuat;
    @Column(name = "CAUHINH")
    private String cauHinh;

    @ManyToOne
    @JoinColumn(name = "MANCC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private NhaCungCap ncc;

    @Column(name = "HINHANH")
    private String hinhAnh;
}
