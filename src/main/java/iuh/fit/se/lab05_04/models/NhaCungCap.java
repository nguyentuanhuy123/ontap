package iuh.fit.se.lab05_04.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "nhacungcap")
public class NhaCungCap {
    @Id
    @Column(name = "MANCC")
    private String maNcc;
    @Column(name = "TENNHACC")
    private String tenNhaCc;
    @Column(name = "DIACHI")
    private String diaChi;
    @Column(name = "SODIENTHOAI")
    private String soDienThoai;

    @OneToMany(mappedBy = "ncc")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<DienThoai> dienThoais;
}
